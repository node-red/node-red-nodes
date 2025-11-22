
module.exports = function(RED) {
    "use strict";
    const toonlib = require("@toon-format/toon")

    function ToonNode(n) {
        RED.nodes.createNode(this,n);
        this.property = n.property || "payload";
        var node = this;

        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (typeof(value) !== "string") {
                    // Take object and make into a toon string
                    try {
                        value = toonlib.encode(value);
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                    }
                    catch(err) {
                        node.error("Failed to encode: "+err.message,msg);
                    }
                }
                else {
                    // Take toon string and make into object
                    try {
                        value = toonlib.decode(value)
                        RED.util.setMessageProperty(msg,node.property,value)
                        node.send(msg)
                    }
                    catch(err) {
                        node.error("Invalid TOON string: "+err.message,msg);
                    }
                }
            }
            else {
                node.warn("No value to process");
            }
        });
    }
    RED.nodes.registerType("toon",ToonNode);
}
