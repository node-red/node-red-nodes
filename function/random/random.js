
module.exports = function(RED) {
    "use strict";
    function RandomNode(n) {
        RED.nodes.createNode(this,n);
        this.low = Number(n.low || 1);
        this.high = Number(n.high || 10);
        this.inte = n.inte || false;
        var node = this;
        this.on("input", function(msg) {
            if (node.inte == "true" || node.inte === true) {
                msg.payload = Math.round(Number(Math.random()) * (node.high - node.low + 1) + node.low - 0.5);
            } else {
                msg.payload = Number(Math.random()) * (node.high - node.low) + node.low;
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType("random",RandomNode);
}
