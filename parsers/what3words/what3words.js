
module.exports = function(RED) {
    "use strict";
    var What3Words = require('geo.what3words');

    var what3wordsNode = function(n) {
        RED.nodes.createNode(this, n);
        this.lang = n.lang || "en";
        this.property = n.property||"payload";
        var node = this;
        //if ( !node.credentials.apikey ) { this.error("No what3words API key set"); }
        this.w3w = new What3Words(node.credentials.apikey);
        var w1 = /^\*\w{6,31}$/;
        var w3 = /^\w+\.\w+\.\w+$/;

        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (value.hasOwnProperty("lat") && value.hasOwnProperty("lon")) {
                    node.w3w.positionToWords({ position:value.lat + "," + value.lon, lang:node.lang })
                        .then(function(response) {
                            value = response; // prom.cape.pump
                            if (!msg.hasOwnProperty("topic") || (msg.topic === "")) { msg.topic = "what3words"; }
                            RED.util.setMessageProperty(msg,node.property,value);
                            node.send(msg);
                        })
                        .catch(function(err) {
                            node.warn(err)
                        });
                }
                else if (typeof (value) === "string") {
                    if (value.split(",").length === 2) { // see if it's 2 comma separated words
                        node.w3w.positionToWords({ position:value, lang:node.lang })
                            .then(function(response) {
                                value = response; // prom.cape.pump
                                if (!msg.hasOwnProperty("topic") || (msg.topic === "")) { msg.topic = "what3words"; }
                                RED.util.setMessageProperty(msg,node.property,value);
                                node.send(msg);
                            })
                            .catch(function(err) {
                                node.warn(err);
                            });
                    }
                    else if (value.match(w3)) { // see if it's 3 dot separated words
                        node.w3w.wordsToPosition({ words:value })
                            .then(function(response) {
                                var loc = {};
                                loc.lat = Number(response.split(",")[0]);
                                loc.lon = Number(response.split(",")[1]);
                                RED.util.setMessageProperty(msg,"location",loc);
                                node.send(msg);
                            })
                            .catch(function(err) {
                                node.warn(err)
                            });
                    }
                    else if (value.match(w1)) { // see if it's a *Oneword
                        node.w3w.wordsToPosition({ words:value })
                            .then(function(response) {
                                var loc = {};
                                loc.lat = Number(response.split(",")[0]);
                                loc.lon = Number(response.split(",")[1]);
                                RED.util.setMessageProperty(msg,"location",loc);
                                node.send(msg);
                            })
                            .catch(function(err) {
                                node.warn(err);
                            });
                    }
                    else { node.warn("No useable data found. See info."); }
                }
                else { node.warn("No useable data found. See info."); }
            }
        });
    }
    RED.nodes.registerType("what3words", what3wordsNode, {
        credentials: { apikey: {type: "password"} }
    });
}
