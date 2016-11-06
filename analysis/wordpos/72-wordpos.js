
module.exports = function(RED) {
    "use strict";
    var WordPos = require('wordpos');
    var wordpos = new WordPos();

    function WordPOSNode(n) {
        RED.nodes.createNode(this,n);
        this.on("input", function(msg) {
            var node = this;
            wordpos.getPOS(msg.payload, function (result) {
                msg.pos = result;
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("wordpos",WordPOSNode);
}
