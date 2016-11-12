
module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var spawn = require('child_process').spawn;
    var fs = require('fs');

    var gpioCommand = __dirname + '/nrsrf.py';

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        //util.log("Info : Ignoring Raspberry Pi specific node.");
        throw "Info : Ignoring Raspberry Pi specific node.";
    }

    if (!fs.existsSync("/usr/share/doc/python-rpi.gpio")) {
        util.log("[rpi-srf] Info : Can't find Pi RPi.GPIO python library.");
        throw "Warning : Can't find Pi RPi.GPIO python library.";
    }

    if (!(1 & parseInt ((fs.statSync(gpioCommand).mode & parseInt ("777", 8)).toString (8)[0]))) {
        util.log("[rpi-srf] Error : " + gpioCommand + " needs to be executable.");
        throw "Error : " + gpioCommand + " must to be executable.";
    }

    function PiSrfNode(n) {
        RED.nodes.createNode(this, n);
        this.pins = n.pins;
        var node = this;

        if (node.pins !== undefined) {
            node.child = spawn(gpioCommand, [node.pins]);
            node.running = true;
            if (RED.settings.verbose) { node.log("pin: " + node.pins + " :"); }

            node.child.stdout.on('data', function(data) {
                if (RED.settings.verbose) { node.log("out: " + data + " :"); }
                data = data.toString().trim();
                if (data.length > 0) {
                    node.send({topic:"SRF",payload:data});
                }
            });

            node.child.stderr.on('data', function(data) {
                if (RED.settings.verbose) { node.log("err: " + data + " :"); }
            });

            node.child.on('close', function(code) {
                if (RED.settings.verbose) { node.log("ret: " + code + " :"); }
                node.child = null;
                node.running = false;
            });

            node.child.on('error', function(err) {
                if (err.errno === "ENOENT") { node.warn('Command not found'); }
                else if (err.errno === "EACCES") { node.warn('Command not executable'); }
                else { node.log('error: ' + err); }
            });

        }
        else {
            node.error("Invalid GPIO pins: " + node.pin);
        }

        var wfi = function(done) {
            if (!node.running) {
                if (RED.settings.verbose) { node.log("end"); }
                done();
                return;
            }
            setTimeout(function() { wfi(done); }, 333);
        }

        node.on("close", function(done) {
            if (node.child != null) {
                node.child.kill('SIGKILL');
            }
            wfi(done);
        });

    }
    RED.nodes.registerType("rpi-srf", PiSrfNode);
}
