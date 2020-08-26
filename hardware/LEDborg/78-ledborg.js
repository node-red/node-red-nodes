
module.exports = function(RED) {
    "use strict";
    var util = require("util");
    //var exec = require('child_process').exec;
    var spawn = require('child_process').spawn;
    var fs = require('fs');
    var LedBorgInUse = false;

    var gpioCommand = __dirname+'/nrgpio';
    var allOK = true;

    try {
        var cpuinfo = fs.readFileSync("/proc/cpuinfo").toString();
        if (cpuinfo.indexOf(": BCM") === -1) {
            RED.log.warn("ledborg : "+RED._("node-red:rpi-gpio.errors.ignorenode"));
            allOK = false;
        }
        else if (!fs.existsSync("/usr/share/doc/python-rpi.gpio")) {
            RED.log.warn("ledborg : "+RED._("node-red:rpi-gpio.errors.libnotfound"));
            allOK = false;
        }
        else if ( !(1 & parseInt ((fs.statSync(gpioCommand).mode & parseInt ("777", 8)).toString (8)[0]) )) {
            RED.log.warn("ledborg : "+RED._("node-red:rpi-gpio.errors.needtobeexecutable",{command:gpioCommand}));
            allOK = false;
        }
    }
    catch(err) {
        RED.log.warn("ledborg : "+RED._("node-red:rpi-gpio.errors.ignorenode"));
        allOK = false;
    }

    // GPIO pins 11 (R), 13 (G), 15 (B).

    function LedBorgNode(n) {
        RED.nodes.createNode(this,n);
        if (LedBorgInUse) { this.error("LEDborg node already in use - you may only have one."); }
        else { LedBorgInUse = true; }
        this.pin = n.pin;
        this.set = n.set || false;
        this.level = n.level || 0;
        this.out = n.out || "out";
        var node = this;
        var p1 = /^[0-2][0-2][0-2]$/
        var p2 = /^\#[A-Fa-f0-9]{6}$/
        var p3 = /^\d+,\d+,\d+$/

        function inputlistener(msg) {
            var rgb = "000";

            if (typeof msg.payload === "number") {
                msg.payload = ("000"+msg.payload.toString()).substr(-3);
            }

            if (typeof msg.payload === "boolean") {
                msg.payload = msg.payload ? "222" : "000";
            }

            if (p1.test(msg.payload)) {
                rgb = msg.payload;
                rgb = Number(rgb[0])*50+","+Number(rgb[1])*50+","+Number(rgb[2])*50;
            }
            else if (p2.test(msg.payload)) {
                var r = Math.floor(parseInt(msg.payload.slice(1,3),16)*100/256).toString();
                var g = Math.floor(parseInt(msg.payload.slice(3,5),16)*100/256).toString();
                var b = Math.floor(parseInt(msg.payload.slice(5),16)*100/256).toString();
                rgb = r+","+g+","+b;
            }
            else if (p3.test(msg.payload)) {
                var c = msg.payload.split(",");
                var r1 = Math.floor(parseInt(c[0])*100/256).toString();
                var g1 = Math.floor(parseInt(c[1])*100/256).toString();
                var b1 = Math.floor(parseInt(c[2])*100/256).toString();
                rgb = r1+","+g1+","+b1;
            }
            else {
                // you can add fancy colours by name here if you want...
                // these are the @cheerlight ones.
                var colors = {"red":"200","green":"020","blue":"002","cyan":"022","white":"222","pink":"201","oldlace":"221",
                    "warmwhite":"221","purple":"101","magenta":"202","yellow":"220","amber":"220","orange":"210","black":"000","off":"000"}
                if (msg.payload.toLowerCase() in colors) {
                    rgb = colors[msg.payload.toLowerCase()];
                    rgb = Number(rgb[0])*50+","+Number(rgb[1])*50+","+Number(rgb[2])*50;
                }
                else {
                    node.warn("Invalid LedBorg colour code");
                }
            }

            if (RED.settings.verbose) { node.log("out: "+msg.payload); }
            if (node.child !== null) {
                node.child.stdin.write(rgb+"\n");
                node.status({fill:"green",shape:"dot",text:msg.payload});
            }
            else {
                node.warn("Command not running");
                node.status({fill:"red",shape:"ring",text:"Command not running"});
            }
        }

        if (allOK === true) {
            node.child = spawn(gpioCommand, ["borg","11"]);
            node.running = true;
            node.status({fill:"green",shape:"dot",text:"OK"});

            node.on("input", inputlistener);

            node.child.stdout.on('data', function (data) {
                if (RED.settings.verbose) { node.log("out: "+data+" :"); }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function () {
                node.child = null;
                node.running = false;
                node.status({fill:"red",shape:"circle",text:""});
                if (RED.settings.verbose) { node.log("closed"); }
                if (node.finished) { node.finished(); }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.warn('Command not found'); }
                else if (err.errno === "EACCES") { node.warn('Command not executable'); }
                else { node.log('error: ' + err); }
            });

            node.on("close", function(done) {
                LedBorgInUse = false;
                node.status({fill:"red",shape:"circle",text:""});
                if (node.child != null) {
                    node.fisnished = done;
                    node.child.stdin.write(" close 11");
                    node.child.kill('SIGKILL');
                }
                else { done(); }
            });
        }
        else {
            LedBorgInUse = false;
            node.status({fill:"grey",shape:"dot",text:"node-red:rpi-gpio.status.not-available"});
        }
    }
    RED.nodes.registerType("ledborg",LedBorgNode);
}
