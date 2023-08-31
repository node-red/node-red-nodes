
module.exports = function (RED) {
    "use strict";
    var multilangsentiment = require('multilang-sentiment');

    function MultiLangSentimentNode(n) {
        RED.nodes.createNode(this, n);
        this.lang = n.lang;
        this.property = n.property || "payload";
        var node = this;

        this.on("input", function (msg) {
            var value = RED.util.getMessageProperty(msg, node.property);
            if (value !== undefined) {
                multilangSentiment(value, node.lang || msg.lang || 'en', { 'words': msg.words || null, 'tokens': msg.tokens || null }, function (err, result) {
                    msg.sentiment = result;
                    msg.sentiment.comparative = msg.sentiment.score / msg.sentiment.tokens.length;      // temporarily addresses an issue in v2.0.0: https://github.com/marcellobarile/multilang-sentiment/issues/10
                    node.send(msg);
                });
            }
            else { node.send(msg); } // If no matching property - just pass it on.
        });
    }
    RED.nodes.registerType("mlsentiment", MultiLangSentimentNode);
}
