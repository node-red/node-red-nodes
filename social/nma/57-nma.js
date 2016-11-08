
module.exports = function(RED) {
    "use strict";
    var nma = require('nma');

    function NMANode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty("pushkey"))) { this.pushkey = credentials.pushkey; }
        else { this.error("No NMA API key set"); }
        var node = this;
        this.on("input",function(msg) {
            var titl = this.title||msg.topic||"Node-RED";
            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else {
                msg.payload = msg.payload.toString();
            }
            if (node.pushkey) {
                nma({
                    "apikey": node.pushkey,
                    "application": "Node-RED",
                    "event": titl,
                    "description": msg.payload,
                    "priority": 0
                }, function (error) {
                    if (error) {
                        node.error("NMA error: " + error,msg);
                    }
                });
            }
            else {
                node.warn("NMA credentials not set.");
            }
        });
    }

    RED.nodes.registerType("nma",NMANode, {
        credentials: {
            pushkey: {type: "password"}
        }
    });
}
