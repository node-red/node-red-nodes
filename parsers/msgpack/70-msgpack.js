
module.exports = function(RED) {
    "use strict";
    var msgpack = require('msgpack-lite');

    function MsgPackNode(n) {
        RED.nodes.createNode(this,n);
        this.property = n.property||"payload";
        var node = this;
        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (Buffer.isBuffer(value)) {
                    var l = value.length;
                    try {
                        value = msgpack.decode(value);
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                        node.status({text:l +" b->o "+ JSON.stringify(value).length});
                    }
                    catch (e) {
                        node.error("Bad decode",msg);
                        node.status({text:"not a msgpack buffer"});
                    }
                }
                else {
                    var le = JSON.stringify(value).length;
                    value = msgpack.encode(value);
                    RED.util.setMessageProperty(msg,node.property,value);
                    node.status({text:le +" o->b "+ value.length});
                    node.send(msg);
                }
            }
            else { node.warn("No payload found to process"); }
        });
    }
    RED.nodes.registerType("msgpack",MsgPackNode);
}
