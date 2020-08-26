
module.exports = function(RED) {
    "use strict";
    var multilangsentiment = require('multilang-sentiment');

    function MultiLangSentimentNode(n) {
        RED.nodes.createNode(this,n);
        this.lang = n.lang;
        this.property = n.property||"payload";
        var node = this;

        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (msg.hasOwnProperty("overrides")) {
                    msg.extras = msg.overrides;
                    delete msg.overrides;
                }
                multilangsentiment(value, node.lang || msg.lang || 'en', {words: msg.extras || null}, function (err, result) {
                    msg.sentiment = result;
                    node.send(msg);
                });
            }
            else { node.send(msg); } // If no matching property - just pass it on.
        });
    }
    RED.nodes.registerType("mlsentiment",MultiLangSentimentNode);
}
