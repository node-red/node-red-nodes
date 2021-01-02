
module.exports = function(RED) {
    "use strict";
    var execSync = require('child_process').execSync;
    var exec = require('child_process').exec;
    var spawn = require('child_process').spawn;
    var fs = require('fs');

    var testCommand = __dirname+'/testgpio.py'
    var gpioCommand = __dirname+'/nrgpio';
    var allOK = true;

    try {
        execSync(testCommand);
    } catch(err) {
        allOK = false;
        RED.log.warn("rpi-gpio : "+RED._("rpi-gpio.errors.ignorenode"));
    }

    // the magic to make python print stuff immediately
    process.env.PYTHONUNBUFFERED = 1;

    var pinsInUse = {};
    var pinTypes = {"out":RED._("rpi-gpio.types.digout"), "tri":RED._("rpi-gpio.types.input"), "up":RED._("rpi-gpio.types.pullup"), "down":RED._("rpi-gpio.types.pulldown"), "pwm":RED._("rpi-gpio.types.pwmout")};

    function GPIOInNode(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = n.pin;
        this.intype = n.intype;
        this.read = n.read || false;
        this.debounce = Number(n.debounce || 25);
        if (this.read) { this.buttonState = -2; }
        var node = this;
        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.intype;
        }
        else {
            if ((pinsInUse[this.pin] !== this.intype)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("rpi-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        if (allOK === true) {
            if (node.pin !== undefined) {
                node.child = spawn(gpioCommand, ["in",node.pin,node.intype,node.debounce]);
                node.running = true;
                node.status({fill:"yellow",shape:"dot",text:"rpi-gpio.status.ok"});

                node.child.stdout.on('data', function (data) {
                    var d = data.toString().trim().split("\n");
                    for (var i = 0; i < d.length; i++) {
                        if (d[i] === '') { return; }
                        if (node.running && node.buttonState !== -1 && !isNaN(Number(d[i])) && node.buttonState !== d[i]) {
                            node.send({ topic:"pi/"+node.pin, payload:Number(d[i]) });
                        }
                        node.buttonState = d[i];
                        node.status({fill:"green",shape:"dot",text:d[i]});
                        if (RED.settings.verbose) { node.log("out: "+d[i]+" :"); }
                    }
                });

                node.child.stderr.on('data', function (data) {
                    if (RED.settings.verbose) { node.log("err: "+data+" :"); }
                });

                node.child.on('close', function (code) {
                    node.running = false;
                    node.child = null;
                    if (RED.settings.verbose) { node.log(RED._("rpi-gpio.status.closed")); }
                    if (node.finished) {
                        node.status({fill:"grey",shape:"ring",text:"rpi-gpio.status.closed"});
                        node.finished();
                    }
                    else { node.status({fill:"red",shape:"ring",text:"rpi-gpio.status.stopped"}); }
                });

                node.child.on('error', function (err) {
                    if (err.errno === "ENOENT") { node.error(RED._("rpi-gpio.errors.commandnotfound")); }
                    else if (err.errno === "EACCES") { node.error(RED._("rpi-gpio.errors.commandnotexecutable")); }
                    else { node.error(RED._("rpi-gpio.errors.error",{error:err.errno})) }
                });

            }
            else {
                node.warn(RED._("rpi-gpio.errors.invalidpin")+": "+node.pin);
            }
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rpi-gpio.status.not-available"});
            if (node.read === true) {
                var val;
                if (node.intype == "up") { val = 1; }
                if (node.intype == "down") { val = 0; }
                setTimeout(function() {
                    node.send({ topic:"pi/"+node.pin, payload:val });
                    node.status({fill:"grey",shape:"dot",text:RED._("rpi-gpio.status.na",{value:val})});
                },250);
            }
        }

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"rpi-gpio.status.closed"});
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.finished = done;
                node.child.stdin.write("close "+node.pin);
                node.child.kill('SIGKILL');
            }
            else { done(); }
        });
    }
    RED.nodes.registerType("rpi-gpio in",GPIOInNode);

    function GPIOOutNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        this.set = n.set || false;
        this.level = n.level || 0;
        this.freq = n.freq || 100;
        this.out = n.out || "out";
        var node = this;
        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.out;
        }
        else {
            if ((pinsInUse[this.pin] !== this.out)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("rpi-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        function inputlistener(msg, send, done) {
            if (msg.payload === "true") { msg.payload = true; }
            if (msg.payload === "false") { msg.payload = false; }
            var out = Number(msg.payload);
            var limit = 1;
            if (node.out === "pwm") { limit = 100; }
            if ((out >= 0) && (out <= limit)) {
                if (RED.settings.verbose) { node.log("out: "+out); }
                if (node.child !== null) {
                    node.child.stdin.write(out+"\n", () => {
                        if (done) { done(); }
                    });
                    node.status({fill:"green",shape:"dot",text:msg.payload.toString()});
                }
                else {
                    node.error(RED._("rpi-gpio.errors.pythoncommandnotfound"),msg);
                    node.status({fill:"red",shape:"ring",text:"rpi-gpio.status.not-running"});
                }
            }
            else { node.warn(RED._("rpi-gpio.errors.invalidinput")+": "+out); }
        }

        if (allOK === true) {
            if (node.pin !== undefined) {
                if (node.set && (node.out === "out")) {
                    node.child = spawn(gpioCommand, [node.out,node.pin,node.level]);
                    node.status({fill:"green",shape:"dot",text:node.level});
                } else {
                    node.child = spawn(gpioCommand, [node.out,node.pin,node.freq]);
                    node.status({fill:"yellow",shape:"dot",text:"rpi-gpio.status.ok"});
                }
                node.running = true;

                node.on("input", inputlistener);

                node.child.stdout.on('data', function (data) {
                    if (RED.settings.verbose) { node.log("out: "+data+" :"); }
                });

                node.child.stderr.on('data', function (data) {
                    if (RED.settings.verbose) { node.log("err: "+data+" :"); }
                });

                node.child.on('close', function (code) {
                    node.child = null;
                    node.running = false;
                    if (RED.settings.verbose) { node.log(RED._("rpi-gpio.status.closed")); }
                    if (node.finished) {
                        node.status({fill:"grey",shape:"ring",text:"rpi-gpio.status.closed"});
                        node.finished();
                    }
                    else { node.status({fill:"red",shape:"ring",text:"rpi-gpio.status.stopped"}); }
                });

                node.child.on('error', function (err) {
                    if (err.errno === "ENOENT") { node.error(RED._("rpi-gpio.errors.commandnotfound")); }
                    else if (err.errno === "EACCES") { node.error(RED._("rpi-gpio.errors.commandnotexecutable")); }
                    else { node.error(RED._("rpi-gpio.errors.error")+': ' + err.errno); }
                });

            }
            else {
                node.warn(RED._("rpi-gpio.errors.invalidpin")+": "+node.pin);
            }
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rpi-gpio.status.not-available"});
            node.on("input", function(msg) {
                node.status({fill:"grey",shape:"dot",text:RED._("rpi-gpio.status.na",{value:msg.payload.toString()})});
            });
        }

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"rpi-gpio.status.closed"});
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.finished = done;
                node.child.stdin.write("close "+node.pin);
                node.child.kill('SIGKILL');
            }
            else { done(); }
        });

    }
    RED.nodes.registerType("rpi-gpio out",GPIOOutNode);

    function PiMouseNode(n) {
        RED.nodes.createNode(this,n);
        this.butt = n.butt || 7;
        var node = this;

        if (allOK === true) {
            node.child = spawn(gpioCommand+".py", ["mouse",node.butt]);
            node.status({fill:"green",shape:"dot",text:"rpi-gpio.status.ok"});

            node.child.stdout.on('data', function (data) {
                data = Number(data);
                if (data !== 0) { node.send({ topic:"pi/mouse", button:data, payload:1 }); }
                else { node.send({ topic:"pi/mouse", button:data, payload:0 }); }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                node.child = null;
                node.running = false;
                if (RED.settings.verbose) { node.log(RED._("rpi-gpio.status.closed")); }
                if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"rpi-gpio.status.closed"});
                    node.finished();
                }
                else { node.status({fill:"red",shape:"ring",text:"rpi-gpio.status.stopped"}); }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.error(RED._("rpi-gpio.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { node.error(RED._("rpi-gpio.errors.commandnotexecutable")); }
                else { node.error(RED._("rpi-gpio.errors.error")+': ' + err.errno); }
            });

            node.on("close", function(done) {
                node.status({fill:"grey",shape:"ring",text:"rpi-gpio.status.closed"});
                if (node.child != null) {
                    node.finished = done;
                    node.child.kill('SIGINT');
                    node.child = null;
                }
                else { done(); }
            });
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rpi-gpio.status.not-available"});
        }
    }
    RED.nodes.registerType("rpi-mouse",PiMouseNode);

    function PiKeyboardNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        var doConnect = function() {
            node.child = spawn(gpioCommand+".py", ["kbd","0"]);
            node.status({fill:"green",shape:"dot",text:"rpi-gpio.status.ok"});

            node.child.stdout.on('data', function (data) {
                var d = data.toString().trim().split("\n");
                for (var i = 0; i < d.length; i++) {
                    if (d[i] !== '') {
                        var b = d[i].trim().split(",");
                        var act = "up";
                        if (b[1] === "1") { act = "down"; }
                        if (b[1] === "2") { act = "repeat"; }
                        node.send({ topic:"pi/key", payload:Number(b[0]), action:act });
                    }
                }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                node.running = false;
                node.child = null;
                if (RED.settings.verbose) { node.log(RED._("rpi-gpio.status.closed")); }
                if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"rpi-gpio.status.closed"});
                    node.finished();
                }
                else {
                    node.status({fill:"red",shape:"ring",text:"rpi-gpio.status.stopped"});
                    setTimeout(function() { doConnect(); },2000)
                }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.error(RED._("rpi-gpio.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { node.error(RED._("rpi-gpio.errors.commandnotexecutable")); }
                else { node.error(RED._("rpi-gpio.errors.error")+': ' + err.errno); }
            });
        }

        if (allOK === true) {
            doConnect();

            node.on("close", function(done) {
                node.status({});
                if (node.child != null) {
                    node.finished = done;
                    node.child.kill('SIGINT');
                    node.child = null;
                }
                else { done(); }
            });
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rpi-gpio.status.not-available"});
        }
    }
    RED.nodes.registerType("rpi-keyboard",PiKeyboardNode);

    var pitype = { type:"" };
    if (allOK === true) {
        exec(gpioCommand+" info", function(err,stdout,stderr) {
            if (err) {
                RED.log.info(RED._("rpi-gpio.errors.version"));
            }
            else {
                try {
                    var info = JSON.parse( stdout.trim().replace(/\'/g,"\"") );
                    pitype.type = info["TYPE"];
                }
                catch(e) {
                    RED.log.info(RED._("rpi-gpio.errors.sawpitype"),stdout.trim());
                }
            }
        });
    }

    RED.httpAdmin.get('/rpi-gpio/:id', RED.auth.needsPermission('rpi-gpio.read'), function(req,res) {
        res.json(pitype);
    });

    RED.httpAdmin.get('/rpi-pins/:id', RED.auth.needsPermission('rpi-gpio.read'), function(req,res) {
        res.json(pinsInUse);
    });
}
