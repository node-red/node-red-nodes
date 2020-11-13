
module.exports = function(RED) {
    "use strict";
    function RandomNode(n) {
        RED.nodes.createNode(this,n);

        this.low = n.low
        this.high = n.high
        this.inte = n.inte || false;
        this.property = n.property||"payload";
        var node = this;
        var tmp = {};  

        this.on("input", function(msg) {

           if (node.low === "") {
               tmp.low = 1;
               if ('from' in msg) {
                 tmp.low = msg.from} 
           }
                
           if (node.high === "") {
               tmp.high = 10; 
               if ('to' in msg) {tmp.high = msg.to} 
           }
           
          // if tmp.low or tmp.high is not a number flag an error and do not send out a msg
          if ( (isNaN(tmp.low)) || (isNaN(tmp.high)) ) {
              this.error({node:"random",text:"one of the input values is not a number"})
          } 
          else {
          // force tmp.high/low to Numbers since they may be a string
             tmp.low = Number(tmp.low)
             tmp.high = Number(tmp.high)

           // flip the values if low > high so random will work
             var value = 0;
             if (tmp.low > tmp.high) {  
                 value = tmp.low
                 tmp.low = tmp.high
                 tmp.high = value
             }

           // if returning an integer, do a parseInt() on the low and high values
           // before generate the random number. This must be done to insure the rounding
           // doesn't go up if using something like 4.7 or you can end up with 5
             if ( (node.inte == "true") || (node.inte === true) ) {
                 tmp.low  = parseInt(tmp.low);
                 tmp.high = parseInt(tmp.high);
                 value = Math.round(Math.random() * (tmp.high - tmp.low + 1) + tmp.low - 0.5);
             } else {
                 value = (Math.random() * (tmp.high - tmp.low)) + tmp.low;
             }
            
             RED.util.setMessageProperty(msg,node.property,value);

             node.send(msg);
           }
        });
    }
    RED.nodes.registerType("random",RandomNode);
}
