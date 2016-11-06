
module.exports = function(RED) {
    "use strict";
    var growl = require('growl');
    var imagefile = process.env.NODE_RED_HOME+"/public/node-red.png";

    function NotifyNode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        var node = this;
        node.on("input",function(msg) {
            var titl = node.title || msg.topic;
            if (typeof(msg.payload) == 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            if (typeof(titl) != 'undefined') {
                growl(msg.payload, { title: titl, image: imagefile });
            }
            else {
                growl(msg.payload, { image: imagefile });
            }
        });
    }

    RED.nodes.registerType("notify",NotifyNode);
}
