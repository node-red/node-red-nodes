/**
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var spawn = require('child_process').spawn;
    var fs =  require('fs');
    var PNG = require('pngjs').PNG;

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
            var s = msg.payload.toUpperCase().split(",");
            if (s.length === 1) {
                if (s[0] == "CLS") {
                    //console.log("CLEAR")
                    pic.fill(0);
                    node.items = {};
                }
                if (s[0] == "DEL") {
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
                for (var i=0; i<192; i++) {
                    pic[i]   = s[0];
                    pic[i+1] = s[1];
                    pic[i+2] = s[2];
                    i += 2;
                }
            }
            else if (s.length === 5) {
                if (msg.topic) {
                    node.items[msg.topic] = msg.payload;
                }
                else {
                    //console.log("PIXEL",b);
                    if ((s[0] === "*") && (s[1] === "*")) {
                        for (var c=0; c<192; c++) {
                            pic[c]   = s[2];
                            pic[c+1] = s[3];
                            pic[c+2] = s[4];
                            c += 2;
                        }
                    }
                    else if (s[0] === "*") {
                        for (var d=0; d<8; d++) {
                            pic[d*3+s[1]*24]   = s[2];
                            pic[d*3+s[1]*24+1] = s[3];
                            pic[d*3+s[1]*24+2] = s[4];
                        }
                    }
                    else if (s[1] === "*") {
                        for (var e=0; e<8; e++) {
                            pic[s[0]*3+e*24]   = s[2];
                            pic[s[0]*3+e*24+1] = s[3];
                            pic[s[0]*3+e*24+2] = s[4];
                        }
                    }
                    else {
                        pic[s[0]*3+s[1]*24]   = s[2];
                        pic[s[0]*3+s[1]*24+1] = s[3];
                        pic[s[0]*3+s[1]*24+2] = s[4];
                    }
                }
            }
            else {
                if (node.items.hasOwnProperty(msg.topic)) { delete node.items[msg.topic]; }
            }

            var pixels = new Buffer(192);
            pic.copy(pixels);
            for (var p in node.items) {
                var b = node.items[p].split(",");
                if (b[0] === "*") {
                    for (var d=0; d<8; d++) {
                        pixels[d*3+b[1]*24] = b[2];
                        pixels[d*3+b[1]*24+1] = b[3];
                        pixels[d*3+b[1]*24+2] = b[4];
                    }
                }
                else if (b[1] === "*") {
                    for (var e=0; e<8; e++) {
                        pixels[b[0]*3+e*24] = b[2];
                        pixels[b[0]*3+e*24+1] = b[3];
                        pixels[b[0]*3+e*24+2] = b[4];
                    }
                }
                else {
                    pixels[b[0]*3+b[1]*24] = b[2];
                    pixels[b[0]*3+b[1]*24+1] = b[3];
                    pixels[b[0]*3+b[1]*24+2] = b[4];
                }
            }
            node.child.stdin.write(pixels);
            node.child.stdin.write("\n");
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

        node.child.on('close', function (code) {
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
            if (node.tout) { clearTimeout(tout); }
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
