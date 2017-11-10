
module.exports = function(RED) {
    "use strict";
    var What3Words = require('geo.what3words');

    var what3wordsNode = function(n) {
        RED.nodes.createNode(this, n);
        this.lang = n.lang || "en";
        var node = this;
        //if ( !node.credentials.apikey ) { this.error("No what3words API key set"); }
        this.w3w = new What3Words(node.credentials.apikey);
        var w1 = /^\*\w{6,31}$/;
        var w3 = /^\w+\.\w+\.\w+$/;
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("location") && msg.location.hasOwnProperty("lat") && msg.location.hasOwnProperty("lon")) {
                node.w3w.positionToWords({ position:msg.location.lat + "," + msg.location.lon, lang:node.lang })
                    .then(function(response) {
                        msg.payload = response; // prom.cape.pump
                        if (!msg.hasOwnProperty("topic") || (msg.topic === "")) { msg.topic = "what3words"; }
                        node.send(msg);
                    })
                    .catch(function(err) {
                        node.warn(err)
                    });
            }
            else if (msg.hasOwnProperty("payload") && msg.payload.hasOwnProperty("lat") && msg.payload.hasOwnProperty("lon")) {
                node.w3w.positionToWords({ position:msg.payload.lat + "," + msg.payload.lon, lang:node.lang })
                    .then(function(response) {
                        msg.payload = response; // prom.cape.pump
                        if (!msg.hasOwnProperty("topic") || (msg.topic === "")) { msg.topic = "what3words"; }
                        node.send(msg);
                    })
                    .catch(function(err) {
                        node.warn(err)
                    });
            }
            else if (typeof (msg.payload) === "string") {
                if (msg.payload.split(",").length === 2) { // see if it's 2 comma separated words
                    node.w3w.positionToWords({ position:msg.payload, lang:node.lang })
                        .then(function(response) {
                            msg.payload = response; // prom.cape.pump
                            if (!msg.hasOwnProperty("topic") || (msg.topic === "")) { msg.topic = "what3words"; }
                            node.send(msg);
                        })
                        .catch(function(err) {
                            node.warn(err);
                        });
                }
                else if (msg.payload.match(w3)) { // see if it's 3 dot separated words
                    node.w3w.wordsToPosition({ words:msg.payload })
                        .then(function(response) {
                            if (!msg.hasOwnProperty("location")) { msg.location = {}; }
                            msg.location.lat = Number(response.split(",")[0]);
                            msg.location.lon = Number(response.split(",")[1]);
                            node.send(msg);
                        })
                        .catch(function(err) {
                            node.warn(err)
                        });
                }
                else if (msg.payload.match(w1)) { // see if it's a *Oneword
                    node.w3w.wordsToPosition({ words:msg.payload })
                        .then(function(response) {
                            if (!msg.hasOwnProperty("location")) { msg.location = {}; }
                            msg.location.lat = Number(response.split(",")[0]);
                            msg.location.lon = Number(response.split(",")[1]);
                            msg.payload = response;
                            node.send(msg);
                        })
                        .catch(function(err) {
                            node.warn(err);
                        });
                }
                else { node.warn("No useable data found. See info."); }
            }
            else { node.warn("No useable data found. See info."); }
        });
    }
    RED.nodes.registerType("what3words", what3wordsNode, {
        credentials: { apikey: {type: "password"} }
    });
}
