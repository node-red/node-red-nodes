
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
                    // Take json object and make into a toon string
                    try {
                        value = toonlib.encode(value);
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                    }
                    catch(err) {
                        node.error("Failed to encode: "+err.message,msg);
                    }
                }
                else if (typeof value === "string") {
                    // Take toon string and make into json object
                    try {
                        value = toonlib.decode(value)
                        RED.util.setMessageProperty(msg,node.property,value)
                        node.send(msg)
                    }
                    catch(err) {
                        node.error("Invalid TOON string: "+err.message,msg);
                    }
                }
                else {
                    node.warn("Cannot handle this type of input");
                }
            }
            else {
                node.warn("No property found to process");
            }
        });
    }
    RED.nodes.registerType("toon",ToonNode);
}
