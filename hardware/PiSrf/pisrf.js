
module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var spawn = require('child_process').spawn;
    var fs = require('fs');

    var gpioCommand = __dirname + '/nrsrf.py';
    var allOK = true;

    try {
        var cpuinfo = fs.readFileSync("/proc/cpuinfo").toString();
        if (cpuinfo.indexOf(": BCM") === -1) {
            RED.log.warn("rpi-srf : "+RED._("node-red:rpi-gpio.errors.ignorenode"));
            allOK = false;
        }
        else if (!fs.existsSync("/usr/share/doc/python-rpi.gpio")) {
            RED.log.warn("rpi-srf : "+RED._("node-red:rpi-gpio.errors.libnotfound"));
            allOK = false;
        }
        else if (!(1 & parseInt ((fs.statSync(gpioCommand).mode & parseInt ("777", 8)).toString (8)[0]))) {
            RED.log.warn("rpi-srf : "+RED._("node-red:rpi-gpio.errors.needtobeexecutable",{command:gpioCommand}));
            allOK = false;
        }
    }
    catch(err) {
        RED.log.warn("rpi-srf : "+RED._("node-red:rpi-gpio.errors.ignorenode"));
        allOK = false;
    }

    function PiSrfNode(n) {
        RED.nodes.createNode(this, n);
        this.topic = n.topic;
        this.pins = n.pins;
        this.pins += ","+(n.pulse || 0.5);
        var node = this;

        if (allOK === true) {
            if (node.pins !== undefined) {
                node.child = spawn(gpioCommand, [node.pins]);
                node.running = true;
                if (RED.settings.verbose) { node.log("parameters: " + node.pins + " :"); }

                node.child.stdout.on('data', function(data) {
                    if (RED.settings.verbose) { node.log("out: " + data + " :"); }
                    data = data.toString().trim();
                    if (data.length > 0) {
                        node.send({topic:node.topic, payload:data});
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
                node.error("Invalid Parameters: " + node.pins);
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
        else {
            node.status({fill:"grey",shape:"dot",text:"node-red:rpi-gpio.status.not-available"});
        }
    }
    RED.nodes.registerType("rpi-srf", PiSrfNode);
}
