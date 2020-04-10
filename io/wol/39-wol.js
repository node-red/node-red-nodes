
module.exports = function(RED) {
    "use strict";
    var wol = require('wake_on_lan');
    var chk = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

    function WOLnode(n) {
        RED.nodes.createNode(this,n);
        this.mac = n.mac.trim();
        this.host = n.host;
        this.udpport = n.udpport;
        var node = this;

        this.on("input", function(msg) {
            var mac = this.mac || msg.mac || null;
            var host = this.host || msg.host || '255.255.255.255';
            var udpport = Number(msg.udpport || this.udpport || '9');
            if (udpport < 1 || udpport > 65535) {
                node.warn("WOL: UDP port must be within 1 and 65535; it has been reset to 9.");
                udpport = 9;
            }            
            if (mac != null) {
                if (chk.test(mac)) {
                    try {
                        wol.wake(mac, {address: host, port: udpport}, function(error) {
                            if (error) {
                                node.warn(error);
                                node.status({fill:"red",shape:"ring",text:" "});
                            }
                            else if (RED.settings.verbose) {
                                node.log("sent WOL magic packet");
                                node.status({fill:"green",shape:"dot",text:" "});
                            }
                        });
                    }
                    catch(e) {
                        if (RED.settings.verbose) { node.log("WOL: socket error"); }
                    }
                }
                else { node.warn('WOL: bad mac address "'+mac+'"'); }
            }
            else { node.warn("WOL: no mac address specified"); }
        });

        this.on("close", function () {
            node.status({});
        })
    }
    RED.nodes.registerType("wake on lan",WOLnode);
}
