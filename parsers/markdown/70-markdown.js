
module.exports = function(RED) {
    "use strict";
    var markdownNode = function(n) {
        var md = require('markdown-it')({html:true, linkify:true, typographer:true});

        RED.nodes.createNode(this,n);

        this.property = n.property || "payload";
        var node = this;

        node.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg, node.property);
            if (value !== undefined && typeof value === "string") {
                RED.util.setMessageProperty(msg, node.property, md.render(value));
                node.send(msg);
            } else {
                node.warn("No property value of type string found");
            }
        });
    }
    RED.nodes.registerType("markdown",markdownNode);
}
