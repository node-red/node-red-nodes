/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var What3Words = require('geo.what3words');

    var what3wordsNode = function(n) {
        RED.nodes.createNode(this, n);
        this.lang = n.lang || "en";
        var credentials = RED.nodes.getCredentials(n.id);
        if ((credentials) && (credentials.hasOwnProperty("pushkey"))) { this.pushkey = credentials.pushkey; } else { this.error("No what3words API key set"); }
        this.w3w = new What3Words(this.pushkey);
        var node = this;
        var w1 = /^\*\w{6,31}$/;
        var w3 = /^\w+\.\w+\.\w+$/;
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("location")) {
                var lat = msg.location.lat;
                var lon = msg.location.lon;
                node.w3w.positionToWords({ position:lat + "," + lon, lang:node.lang })
                    .then(function(response) {
                        msg.payload = response; // prom.cape.pump
                        if (!msg.hasOwnProperty("topic") || (msg.topic === "")) { msg.topic = "what3words"; }
                        node.send(msg);
                    })
                    .catch(function(err) {
                        node.warn(err)
                    });
            } else if (typeof (msg.payload) === "string") {
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
                } else if (msg.payload.match(w3)) { // see if it's 3 dot separated words
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
                } else if (msg.payload.match(w1)) { // see if it's a *Oneword
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
                } else { node.warn("No useable data found. See info."); }
            } else { node.warn("No useable data found. See info."); }
        });
    }
    RED.nodes.registerType("what3words", what3wordsNode);

    var querystring = require('querystring');

    RED.httpAdmin.get('/what3words/:id', function(req, res) {
        var credentials = RED.nodes.getCredentials(req.params.id);
        if (credentials) {
            res.send(JSON.stringify({hasPassword:(credentials.pushkey && credentials.pushkey !== "")}));
        } else {
            res.send(JSON.stringify({}));
        }
    });

    RED.httpAdmin.delete('/what3words/:id', function(req, res) {
        RED.nodes.deleteCredentials(req.params.id);
        res.send(200);
    });

    RED.httpAdmin.post('/what3words/:id', function(req, res) {
        var body = "";
        req.on('data', function(chunk) {
            body += chunk;
        });
        req.on('end', function() {
            var newCreds = querystring.parse(body);
            var credentials = RED.nodes.getCredentials(req.params.id) || {};
            if (newCreds.pushkey === "") {
                delete credentials.pushkey;
            } else {
                credentials.pushkey = newCreds.pushkey || credentials.pushkey;
            }
            RED.nodes.addCredentials(req.params.id, credentials);
            res.send(200);
        });
    });
}
