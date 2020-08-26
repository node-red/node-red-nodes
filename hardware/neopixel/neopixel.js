
module.exports = function(RED) {
    "use strict";
    var spawn = require('child_process').spawn;
    var execSync = require('child_process').execSync;
    var fs = require('fs');
    var colors = require('./colours.js');
    var piCommand = __dirname+'/neopix';
    var allOK = true;

    try {
        var cpuinfo = fs.readFileSync("/proc/cpuinfo").toString();
        if (cpuinfo.indexOf(": BCM") === -1) {
            RED.log.warn("rpi-neopixels : "+RED._("node-red:rpi-gpio.errors.ignorenode"));
            allOK = false;
        }
        else if (execSync('python -c "import rpi_ws281x"').toString() !== "") {
            RED.log.warn("rpi-neopixels : Can't find neopixel python library");
            allOK = false;
        }
        else if (!(1 & parseInt ((fs.statSync(piCommand).mode & parseInt ("777", 8)).toString (8)[0]))) {
            RED.log.warn("rpi-neopixels : "+RED._("node-red:rpi-gpio.errors.needtobeexecutable",{command:piCommand}));
            allOK = false;
        }
    }
    catch(err) {
        RED.log.warn("rpi-neopixels : "+RED._("node-red:rpi-gpio.errors.ignorenode"));
        allOK = false;
    }

    // the magic to make python print stuff immediately
    process.env.PYTHONUNBUFFERED = 1;

    function PiNeopixelNode(n) {
        RED.nodes.createNode(this,n);
        this.pixels = n.pixels || 1;
        this.bgnd = n.bgnd || "0,0,0";
        this.fgnd = n.fgnd || "128,128,128";
        this.mode = n.mode || "pcent";
        this.rgb = n.rgb || "rgb";
        this.gamma = n.gamma;
        if (this.gamma === undefined) { this.gamma = true; }
        this.brightness = Number(n.brightness || 100);
        this.wipe = Number(n.wipe || 40);
        if (this.wipe < 0) { this.wipe = 0; }
        if (this.brightness < 0) { this.brightness = 0; }
        if (this.brightness > 100) { this.brightness = 100; }
        var node = this;
        var needle = "255,255,255";
        //var p1 = /^\#[A-Fa-f0-9]{6}$/
        var p2 = /^[0-9]+,[0-9]+,[0-9]+$/
        var p3 = /^[0-9]+,[0-9]+,[0-9]+,[0-9]+$/
        var p4 = /^[0-9]+,[0-9]+,[0-9]+,[0-9]+,[0-9]+$/

        function inputlistener(msg) {
            if (msg.hasOwnProperty("brightness")) {
                node.child.stdin.write("brightness,"+msg.brightness.toString()+"\n");
            }
            if (msg.hasOwnProperty("payload")) {
                var pay = msg.payload.toString().toUpperCase();
                var parts = pay.split(",");
                if (parts.length <= 2) {
                    if (parts.length === 2) { // it's a colour and length
                        if (isNaN(parseInt(parts[1]))) { parts = parts.reverse(); }
                        if (colors.getRGB(parts[0],node.rgb)) {
                            var l = parts[1];
                            if (node.mode.indexOf("pcent") >= 0) { l = parseInt(l / 100 * node.pixels + 0.5); }
                            l = l - 1;
                            if (node.mode.indexOf("need") >= 0) {
                                needle = colors.getRGB(parts[0],node.rgb);
                                pay = "0,"+(l-1)+","+node.fgnd+"\n"+l+","+needle+"\n"+(l+1)+","+(node.pixels-1)+","+node.bgnd;
                            }
                            else {
                                node.fgnd = colors.getRGB(parts[0],node.rgb);
                                pay = "0,"+l+","+node.fgnd+"\n"+(l+1)+","+(node.pixels-1)+","+node.bgnd;
                            }
                        }
                        else { node.warn("Invalid colour : "+pay); return; }
                    }
                    else {
                        if (isNaN(pay)) { // it's a single colour word so set background
                            if (colors.getRGB(pay,node.rgb)) {
                                node.bgnd = colors.getRGB(pay,node.rgb);
                                pay = node.bgnd;
                            }
                            else { node.warn("Invalid payload : "+pay); return; }
                        }
                        else { // it's a single number so just draw bar
                            var ll = pay;
                            if (node.mode.indexOf("pcent") >= 0) { ll = parseInt(ll / 100 * node.pixels + 0.5); }
                            ll = ll - 1;
                            if (node.mode.indexOf("need") >= 0) {
                                pay = "0,"+(ll-1)+","+node.fgnd+"\n"+ll+","+needle+"\n"+(ll+1)+","+(node.pixels-1)+","+node.bgnd;
                            }
                            else {
                                pay = "0,"+ll+","+node.fgnd+"\n"+(ll+1)+","+(node.pixels-1)+","+node.bgnd;
                            }
                        }
                    }
                    node.child.stdin.write(pay+"\n");
                    return;
                }
                if ( p2.test(pay) || p3.test(pay) || p4.test(pay) ) {
                    if ((parts.length > 2) && (node.rgb === "grb")) { // swap r and g values
                        var tmp = parts[parts.length-3];
                        parts[parts.length-3] = parts[parts.length-2];
                        parts[parts.length-2] = tmp;
                    }
                    if (parts.length === 3) { node.bgnd = parts.join(","); }
                    node.child.stdin.write(parts.join(",")+"\n"); // handle 3 parts, 4 part and 5 parts in the python
                }
                else { node.warn("Invalid payload : "+pay); }
            }
        }

        if (allOK === true) {
            node.child = spawn(piCommand, [node.pixels, node.wipe, node.mode, node.brightness, node.gamma]);
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
                if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"closed"});
                    node.finished();
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
                if (node.child != null) {
                    node.finished = done;
                    node.child.kill('SIGKILL');
                }
                else { done(); }
            });

            if (node.bgnd) {
                if (node.bgnd.split(',').length === 1) {
                    node.bgnd = colors.getRGB(node.bgnd,node.rgb);
                }
                if (node.mode.indexOf("shift") === -1) {
                    node.child.stdin.write(node.bgnd+"\n");
                }
            }

            if (node.fgnd) {
                if (node.fgnd.split(',').length === 1) {
                    node.fgnd = colors.getRGB(node.fgnd,node.rgb);
                }
            }
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"node-red:rpi-gpio.status.not-available"});
        }
    }
    RED.nodes.registerType("rpi-neopixels",PiNeopixelNode);
}
