
module.exports = function(RED) {
    "use strict";
    function RandomNode(n) {
        RED.nodes.createNode(this,n);

        this.status({}); // blank status on a deploy

        this.inte = n.inte || false;
        this.property = n.property||"payload";
        var node = this;


        this.on("input", function(msg) {
 
           if (n.low !== "") {this.low  = parseFloat(n.low)}
              else {this.low = n.low}; 
           if (n.high !== "") {this.high  = parseFloat(n.high)}
              else {this.high = n.high}; 
      
           if (node.low === "") {
               node.low = 1;
               if ('from' in msg) {node.low = msg.from} 
           }
                
           if (node.high === "") {
               node.high = 10; 
               if ('to' in msg) {node.high = msg.to} 
           }

           // if returning an interger, do a parseInt() on the low and high values
           if ( (node.inte == "true") || (node.inte === true) ) {
               node.low  = parseInt(node.low);
               node.high = parseInt(node.high);
           }

           // flip the values if low > high so random will work
           var value;
           if (node.low > node.high) {  
               value = node.low
               node.low = node.high
               node.high = value
           }
           // generate the random number
           if ( (node.inte == "true") || (node.inte === true) ) {
               node.low  = Math.round(node.low)
               node.high = Math.round(node.high)
               value = Math.round(Math.random() * (node.high - node.low + 1) + node.low - 0.5);
           } else {
               value = Math.random() * (node.high - node.low) + node.low;
           }
            
           RED.util.setMessageProperty(msg,node.property,value);

           // output a status under the node
           var color = "grey";
           if ( (isNaN(node.low)) || (isNaN(node.high)) ) {
              this.status({fill:"red",shape:"dot",text:"random: from " + node.low + " to " + node.high})
              this.error({node:"random",text:"one of the input values is not a number"})
           } else {
              this.status({fill:"grey",shape:"dot",text:"random: from " + node.low + " to " + node.high + " value=" + value});
              node.send(msg);
           }
        });
    }
    RED.nodes.registerType("random",RandomNode);
}
