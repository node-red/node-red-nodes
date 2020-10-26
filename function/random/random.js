
module.exports = function(RED) {
    "use strict";
    function RandomNode(n) {
        RED.nodes.createNode(this,n);

        this.low  = Number(n.low) || ""; 
        this.high = Number(n.high) || "";
        this.inte = n.inte || false;
        this.property = n.property||"payload";
        var node = this;
        
      
        this.on("input", function(msg) {

            if (node.low === "") {
                node.low = 1
                if ('from' in msg) {
                    if ( (typeof msg.from === 'number') || ( (typeof msg.from === 'string') && (!isNaN(Number(msg.from)) ) )) {
                        node.low = Number(msg.from)
                    }
                } 
            }
    
            if (node.high === "") {
                node.high = 10 
                if ('to' in msg) {
                    if ( (typeof msg.to === 'number') || ( (typeof msg.to === 'string') && (!isNaN(Number(msg.to)) ) )) {
                        node.high = Number(msg.to)
                    }
                } 
            }
            
            // flip the values if low > high
            var value;
            if (node.low > node.high) {  
                value = node.low
                node.low = node.high
                node.high = value
            }

            if (node.inte == "true" || node.inte === true) {
                value = Math.round(Math.random() * (node.high - node.low + 1) + node.low - 0.5);
            }
            else {
                value = Math.random() * (node.high - node.low) + node.low;
            }
            RED.util.setMessageProperty(msg,node.property,value);
            node.send(msg);
        });
    }
    RED.nodes.registerType("random",RandomNode);
}
