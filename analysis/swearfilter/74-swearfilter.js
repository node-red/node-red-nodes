
module.exports = function(RED) {
    "use strict";

    function BadwordsNode(n) {
        RED.nodes.createNode(this,n);
        var badwordsRegExp = require('badwords/regexp');
        var node = this;
        node.on("input", function(msg) {
            if (typeof msg.payload === "string") {
                badwordsRegExp.lastIndex = 0
                if ( !badwordsRegExp.test(msg.payload) ) { node.send(msg); }
            }
        });
    }
    RED.nodes.registerType("badwords",BadwordsNode);
}
