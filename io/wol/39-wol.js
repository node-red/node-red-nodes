
module.exports = function(RED) {
    "use strict";
    var wol = require('wake_on_lan');
    var chk = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;

    function WOLnode(n) {
        RED.nodes.createNode(this,n);
        this.mac = n.mac.trim();
        var node = this;

        this.on("input", function(msg) {
            var mac = this.mac || msg.mac || null;
            if (mac != null) {
                if (chk.test(mac)) {
                    try {
                        wol.wake(mac, function(error) {
                            if (error) { node.warn(error); }
                            else if (RED.settings.verbose) {
                                node.log("sent WOL magic packet");
                            }
                        });
                    } catch(e) {
                        if (RED.settings.verbose) { node.log("WOL: socket error"); }
                    }
                }
                else { node.warn('WOL: bad mac address "'+mac+'"'); }
            }
            else { node.warn("WOL: no mac address specified"); }
        });
    }
    RED.nodes.registerType("wake on lan",WOLnode);
}
