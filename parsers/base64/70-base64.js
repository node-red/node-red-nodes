
module.exports = function(RED) {
    "use strict";
    function Base64Node(n) {
        RED.nodes.createNode(this,n);
        this.property = n.property||"payload";
        var node = this;
        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (Buffer.isBuffer(value)) {
                    // Take binary buffer and make into a base64 string
                    value = value.toString('base64');
                    RED.util.setMessageProperty(msg,node.property,value);
                    node.send(msg);
                }
                else if (typeof value === "string") {
                    // Take base64 string and make into binary buffer
                    var load = value.replace(/\s+/g,'');      // remove any whitespace
                    var regexp = new RegExp('^[A-Za-z0-9+\/=]*$');  // check it only contains valid characters
                    if ( regexp.test(load) && (load.length % 4 === 0) ) {
                        value = new Buffer(load,'base64');
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                    }
                    else {
                        //node.log("Not a Base64 string - maybe we should encode it...");
                        value = (new Buffer(value,"binary")).toString('base64');
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                    }
                }
                else {
                    node.warn("This node only handles strings or buffers.");
                }
            }
            else { node.warn("No property found to process"); }
        });
    }
    RED.nodes.registerType("base64",Base64Node);
}
