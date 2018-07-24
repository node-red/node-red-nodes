
module.exports = function(RED) {
    "use strict";
    function RandomNode(n) {
        RED.nodes.createNode(this,n);
        this.low = Number(n.low || 1);
        this.high = Number(n.high || 10);
        this.inte = n.inte || false;
        this.property = n.property||"payload";
        var node = this;
        this.on("input", function(msg) {
            var value;
            if (node.inte == "true" || node.inte === true) {
                value = Math.round(Number(Math.random()) * (node.high - node.low + 1) + node.low - 0.5);
            }
            else {
                value = Number(Math.random()) * (node.high - node.low) + node.low;
            }
            RED.util.setMessageProperty(msg,node.property,value);
            node.send(msg);
        });
    }
    RED.nodes.registerType("random",RandomNode);
}
