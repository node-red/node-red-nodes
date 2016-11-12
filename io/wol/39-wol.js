
module.exports = function(RED) {
    "use strict";
    var wol = require('wake_on_lan');
    var chk = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;

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
                        node.warn(mac + ' ' + host);
                        wol.wake(mac, {address: host}, function(error) {
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
