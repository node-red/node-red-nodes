
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

            tmp.low = 1                 // set this as the default low value
            tmp.low_e = ""
            if (node.low) {             // if the the node has a value use it
                tmp.low = Number(node.low);
            } else if ('from' in msg) { // else see if a 'from' is in the msg
                tmp.low = Number(msg.from);
                if (isNaN(msg.from)) { // if it isn't a number setup NaN error
                    tmp.low = NaN;
                    tmp.low_e = " From: " + msg.from; // setup to show bad incoming msg.from
                }
            }

            tmp.high = 10               // set this as the default high value
            tmp.high_e = "";
            if (node.high) {            // if the the node has a value use it
                tmp.high = Number(node.high);
            } else if ('to' in msg) {   // else see if a 'to' is in the msg
                tmp.high = Number(msg.to);
                if (isNaN(msg.to)) {   // if it isn't a number setup NaN error
                    tmp.high = NaN
                    tmp.high_e = " To: " + msg.to // setup to show bad incoming msg.to
                }
            }

            // if tmp.low or high are not numbers, send an error msg with bad values
            if ( (isNaN(tmp.low)) || (isNaN(tmp.high)) ) {
                this.error("Random: one of the input values is not a number. " + tmp.low_e + tmp.high_e);
            } else {
                // at this point we have valid values so now to generate the random number!

                // flip the values if low > high so random will work
                var value = 0;
                if (tmp.low > tmp.high) {
                    value = tmp.low
                    tmp.low = tmp.high
                    tmp.high = value
                }

                // if returning an integer, do a math.ceil() on the low value and a
                // Math.floor()high value before generate the random number. This must be
                // done to insure the rounding doesn't round up if using something like 4.7
                // which would end up with 5
                if ( (node.inte == "true") || (node.inte === true) ) {
                    tmp.low  = Math.ceil(tmp.low);
                    tmp.high = Math.floor(tmp.high);
                    // use this to round integers
                    value = Math.round(Math.random() * (tmp.high - tmp.low + 1) + tmp.low - 0.5);
                } else {
                    // use this to round floats
                    value = (Math.random() * (tmp.high - tmp.low)) + tmp.low;
                }

                RED.util.setMessageProperty(msg,node.property,value);
                node.send(msg);
            }
        });
    }
    RED.nodes.registerType("random",RandomNode);
}
