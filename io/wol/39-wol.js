
module.exports = function(RED) {
    "use strict";
    var wol = require('wake_on_lan');
    var chk = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

    function WOLnode(n) {
        RED.nodes.createNode(this,n);
        this.mac = n.mac.trim();
        this.host = n.host;
        var node = this;

        this.on("input", function(msg) {
            var mac = this.mac || msg.mac || null;
            var host = this.host || msg.host || '255.255.255.255';
            if (mac != null) {
                if (chk.test(mac)) {
                    try {
                        wol.wake(mac, {address: host}, function(error) {
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
