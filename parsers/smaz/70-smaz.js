
module.exports = function(RED) {
    "use strict";
    var smaz = require('./smaz.js');

    var smazNode = function(n) {
        RED.nodes.createNode(this,n);
        this.property = n.property||"payload";
        var node = this;
        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (typeof value === "string") {
                    var le = value.length;
                    var c = Buffer.from(smaz.compress(value));
                    RED.util.setMessageProperty(msg,node.property,c);
                    node.status({text:le +" > "+ c.length});
                    node.send(msg);
                }
                else if (Buffer.isBuffer(value)) {
                    var l = value.length;
                    try {
                        var u = smaz.decompress(value);
                        RED.util.setMessageProperty(msg,node.property,u);
                        node.send(msg);
                        node.status({text:l +" < "+ u.length});
                    }
                    catch (e) {
                        node.error("Bad decode",value);
                        node.status({text:"not a smaz buffer"});
                    }
                }
                else {
                    node.status({text:"dropped"});
                }
            }
            else { node.warn("No payload found to process"); }
        });
    }
    RED.nodes.registerType("smaz",smazNode);
}
