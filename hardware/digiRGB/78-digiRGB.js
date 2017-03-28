
module.exports = function(RED) {
    "use strict";
    var HID = require('node-hid');
    var device;
    var node;

    function DigiRGBNode(n) {
        RED.nodes.createNode(this,n);
        node=this;

        var devices = HID.devices(0x16c0,0x05df);
        for (var i=0; i< devices.length; i++) {
            if (devices[i].product == 'DigiUSB') {
                node.log("found: " + devices[i].path);
                try {
                    device = new HID.HID(devices[i].path);
                    break;
                }
                catch (e) {
                    node.log(e)
                }
            }
        }

        var p1 = /^\#[A-Fa-f0-9]{6}$/
        var p2 = /[0-9]+,[0-9]+,[0-9]+/

        if (device) {
            this.on("input", function(msg) {
                if (p1.test(msg.payload)) {
                    var r = parseInt(msg.payload.slice(1,3),16);
                    var g = parseInt(msg.payload.slice(3,5),16);
                    var b = parseInt(msg.payload.slice(5),16);
                    device.sendFeatureReport([115,r,g,b]);
                }
                else if (p2.test(msg.payload)) {
                    var args = msg.payload.split(',');
                    if (args.length == 3) {
                        device.sendFeatureReport([115,parseInt(args[0]),parseInt(args[1]),parseInt(args[2])]);
                    }
                }
                else {
                    node.warn("incompatable input - " + msg.payload);
                }
            });
        }
        else {
            node.warn("no digispark RGB found");
        }

        this.on('close', function() {
            if (device) { device.close(); }
        });
    }
    RED.nodes.registerType("digiRGB",DigiRGBNode);
}
