
module.exports = function(RED) {
    "use strict";
    var Prowl = require('node-prowl');

    try {
        var pushkeys = RED.settings.prowl || require(process.env.NODE_RED_HOME+"/../pushkey.js");
    }
    catch(err) { }

    function ProwlNode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        this.priority = parseInt(n.priority);
        if (this.priority > 2) { this.priority = 2; }
        if (this.priority < -2) { this.priority = -2; }
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty("pushkey"))) { this.pushkey = credentials.pushkey; }
        else {
            if (pushkeys) { this.pushkey = pushkeys.prowlkey; }
            else { this.error("No Prowl credentials set."); }
        }
        this.prowl = false;
        if (this.pushkey) { this.prowl = new Prowl(this.pushkey); }
        var node = this;

        this.on("input",function(msg) {
            var titl = this.title||msg.topic||"Node-RED";
            var pri = msg.priority||this.priority;
            var url = this.url||msg.url;
            var options = { priority:pri };
            if (url) { options.url = url; }
            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else { msg.payload = msg.payload.toString(); }
            if (node.pushkey) {
                try {
                    node.prowl.push(msg.payload, titl, options, function(err, remaining) {
                        if (err) { node.error(err); }
                        node.log( remaining + ' calls to Prowl api during current hour.' );
                    });
                }
                catch (err) {
                    node.error(err);
                }
            }
            else {
                node.warn("Prowl credentials not set.");
            }
        });
    }
    RED.nodes.registerType("prowl",ProwlNode,{
        credentials: {
            pushkey: {type: "password"}
        }
    });
}
