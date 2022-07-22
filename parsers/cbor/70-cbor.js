
module.exports = function(RED) {
    "use strict";
    var cbor = require('cbor-x');

    function CborNode(n) {
        RED.nodes.createNode(this,n);
        this.property = n.property||"payload";
        var node = this;
        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (Buffer.isBuffer(value)) {
                    var l = value.length;
                    try {
                        value = cbor.decode(value);
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                        node.status({text:l +" b->o "+ JSON.stringify(value).length});
                    }
                    catch (e) {
                        node.error("Bad decode",msg);
                        node.status({text:"not a cbor buffer"});
                    }
                }
                else {
                    var le = JSON.stringify(value).length;
                    value = cbor.encode(value);
                    RED.util.setMessageProperty(msg,node.property,value);
                    node.send(msg);
                    node.status({text:le +" o->b "+ value.length});
                }
            }
            else { node.warn("No payload found to process"); }
        });
    }
    RED.nodes.registerType("cbor",CborNode);
}
