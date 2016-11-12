
module.exports = function(RED) {
    "use strict";
    var badwords = require('badwords');
    if (badwords.length === 0 ) { return; }
    var badwordsRegExp = require('badwords/regexp');

    function BadwordsNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.on("input", function(msg) {
            if (typeof msg.payload === "string") {
                if ( !badwordsRegExp.test(msg.payload) ) { node.send(msg); }
            }
        });
    }
    RED.nodes.registerType("badwords",BadwordsNode);
}
