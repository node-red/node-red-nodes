
module.exports = function(RED) {
    "use strict";
    var fs = require('fs');
    var PNG = require('pngjs').PNG;
    var spawn = require('child_process').spawn;

    var hatCommand = __dirname+'/unihat';

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        //RED.log.info(RED._("rpi-gpio.errors.ignorenode"));
        throw "Info : "+RED._("rpi-gpio.errors.ignorenode");
    }

    if (!fs.existsSync('/usr/local/lib/python2.7/dist-packages/unicornhat.py')) {
        RED.log.warn("Can't find Unicorn HAT python libraries");
        throw "Warning : Can't find Unicorn HAT python libraries";
    }

    if ( !(1 & parseInt ((fs.statSync(hatCommand).mode & parseInt ("777", 8)).toString (8)[0]) )) {
        RED.log.error(hatCommand + " command is not executable");
        throw "Error : "+RED._("rpi-gpio.errors.mustbeexecutable");
    }

    // the magic to make python print stuff immediately
    process.env.PYTHONUNBUFFERED = 1;

    function UnicornHatNode(n) {
        RED.nodes.createNode(this,n);
        this.png = n.png;
        this.bright = n.bright || 20;
        this.items = {};
        var node = this;

        var pic = new Buffer(192);
        pic.fill(0);
        var ready = false;
        if (node.png) {
            if (node.png.split(",").length === 3) {
                var c = node.png.split(",");
                for (var i=0; i<192; i++) {
                    pic[i] = c[0];
                    pic[i+1] = c[1];
                    pic[i+2] = c[2];
                    i += 2;
                }
                ready = true;
            }
            else {
                try {
                    var file = fs.readFileSync(node.png);
                    new PNG().parse( file, function(error, data) {
                        if (error) {
                            node.warn("error reading : "+node.png);
                            ready = true;
                        }
                        else {
                            var pix = data.data;
                            var j=0;
                            for (var i=0; i<192; i++) {
                                pic[i] = pix[j];
                                pic[i+1] = pix[j+1];
                                pic[i+2] = pix[j+2];
                                i += 2;
                                j += 4;
                            }
                            ready = true;
                        }
                    });
                }
                catch(e) {
                    node.warn("error loading : "+node.png);
                    ready = true;
                }
            }
        }
        else { ready = true; }

        function inputlistener(msg) {
            if (typeof msg.payload === "string") {
                var a,b,i,j,x,y;
                msg.payload = msg.payload.replace('"','');
                var s = msg.payload.toUpperCase().split(",");
                var doDraw = true;
                if (s.length === 1) {
                    if ((s[0] == "CLS") || (s[0] == "CLR") || (s[0] == "CLEAR")) {
                        //console.log("CLEAR")
                        pic.fill(0);
                        node.items = {};
                    }
                    if ((s[0] == "DEL") || (s[0] == "DELETE")) {
                        //console.log("DELETE")
                        node.items = {};
                    }
                }
                else if (s.length === 2) {
                    if (s[0] === "BRIGHTNESS") {
                        //console.log("BRIGHTNESS",s[1])
                        node.child.stdin.write("B"+s[1]+"\n");
                    }
                    if (s[0] === "ROTATE") {
                        //console.log("ROTATE",s[1])
                        node.child.stdin.write("R"+s[1]+"\n");
                    }
                }
                else if (s.length === 3) {
                    //console.log("BACKGROUND",s)
                    for (i=0; i<192; i++) {
                        pic[i] = s[0];
                        pic[i+1] = s[1];
                        pic[i+2] = s[2];
                        i += 2;
                    }
                }
                else if (s.length % 5 === 0) { // handles pixel updates
                    if (msg.topic) {
                        node.items[msg.topic] = msg.payload;
                    }
                    else {
                        node.child.stdin.write('P'+msg.payload+'\n');
                        doDraw = false;
                        x = [];
                        y = [];
                        for (a = 0; a < s.length; a++) {
                            //console.log("PIXELS",a);
                            if (s[a] === "*") {
                                x[0] = 0;
                                x[1] = 7;
                            }
                            else if (s[a].indexOf("-") !== -1) {
                                x = s[a].split("-").sort();
                            }
                            else { x[0] = x[1] = s[a]; }
                            if (s[a+1] === "*") {
                                y[0] = 0;
                                y[1] = 7;
                            }
                            else if (s[a+1].indexOf("-") !== -1) {
                                y = s[a+1].split("-").sort();
                            }
                            else { y[0] = y[1] = s[a+1]; }

                            for (j = y[0]; j <= y[1]; j++) {
                                for (i = x[0]; i <= x[1]; i++) {
                                    pic[i*3+j*24] = s[a+2];
                                    pic[i*3+j*24+1] = s[a+3];
                                    pic[i*3+j*24+2] = s[a+4];
                                }
                            }

                            a += 4;
                        }
                    }
                }
                else if (s.length === 192) {  // handle complete buffer refresh.
                    for (var h=0; h<192; h++) {
                        pic[h] = s[h];
                        pic[h+1] = s[h+1];
                        pic[h+2] = s[h+2];
                        h += 2;
                    }
                }
                else {
                    if (node.items.hasOwnProperty(msg.topic)) { delete node.items[msg.topic]; }
                }

                if (doDraw) {
                    var pixels = new Buffer(192);
                    pic.copy(pixels);
                    for (var p in node.items) {
                        if (node.items.hasOwnProperty(p)) {
                            b = node.items[p].split(",");
                            x = [];
                            y = [];
                            for (a = 0; a < b.length; a++) {
                                if (b[a] === "*") {
                                    x[0] = 0;
                                    x[1] = 7;
                                }
                                else if (b[a].indexOf("-") !== -1) {
                                    x = b[a].split("-").sort();
                                }
                                else { x[0] = x[1] = b[a]; }
                                if (b[a+1] === "*") {
                                    y[0] = 0;
                                    y[1] = 7;
                                }
                                else if (b[a+1].indexOf("-") !== -1) {
                                    y = b[a+1].split("-").sort();
                                }
                                else { y[0] = y[1] = b[a+1]; }
                                for (j = y[0]; j <= y[1]; j++) {
                                    for (i = x[0]; i <= x[1]; i++) {
                                        pixels[i*3+j*24] = b[a+2];
                                        pixels[i*3+j*24+1] = b[a+3];
                                        pixels[i*3+j*24+2] = b[a+4];
                                    }
                                }
                                a += 4;
                            }
                        }
                    }
                    node.child.stdin.write(pixels);
                    node.child.stdin.write("\n");
                }
            }
            else { node.warn("Input not a string"); }
        }

        node.child = spawn(hatCommand, [node.bright]);
        node.status({fill:"green",shape:"dot",text:"ok"});

        node.on("input", inputlistener);

        node.child.stdout.on('data', function (data) {
            if (RED.settings.verbose) { node.log("out: "+data+" :"); }
        });

        node.child.stderr.on('data', function (data) {
            if (RED.settings.verbose) { node.log("err: "+data+" :"); }
        });

        node.child.on('close', function () {
            node.child = null;
            if (RED.settings.verbose) { node.log(RED._("rpi-gpio.status.closed")); }
            if (node.done) {
                node.status({fill:"grey",shape:"ring",text:"closed"});
                node.done();
            }
            else { node.status({fill:"red",shape:"ring",text:"stopped"}); }
        });

        node.child.on('error', function (err) {
            if (err.errno === "ENOENT") { node.error(RED._("rpi-gpio.errors.commandnotfound")); }
            else if (err.errno === "EACCES") { node.error(RED._("rpi-gpio.errors.commandnotexecutable")); }
            else { node.error(RED._("rpi-gpio.errors.error")+': ' + err.errno); }
        });

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"closed"});
            if (node.tout) { clearTimeout(node.tout); }
            if (node.child != null) {
                node.done = done;
                node.child.kill('SIGKILL');
            }
            else { done(); }
        });

        var nowready = function() {
            node.tout = setTimeout( function() {
                if (ready) { inputlistener({payload:"0"}); }
                else { nowready(); }
            }, 100);
        }
        nowready();
    }
    RED.nodes.registerType("rpi-unicorn",UnicornHatNode);
}
