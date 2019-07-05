
module.exports = function(RED) {
    "use strict";
    var markdownNode = function(n) {
        var md = require('markdown-it')({html:true, linkify:true, typographer:true});
        RED.nodes.createNode(this,n);
        var node = this;
        //<div id="nr-markdown" style="font-family:helvetica neue,arial,helvetica,sans-serif; margin:12px">';
        node.on("input", function(msg) {
            if (msg.payload !== undefined && typeof msg.payload === "string") {
                msg.payload = md.render(msg.payload);
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType("markdown",markdownNode);
}
