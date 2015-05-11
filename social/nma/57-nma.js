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
            else { msg.payload = msg.payload.toString(); }
            if (node.pushkey) {
                nma({
                    "apikey": node.pushkey,
                    "application": "Node-RED",
                    "event": titl,
                    "description": msg.payload,
                    "priority": 0
                }, function (error) {
                    if (error) {
                        node.warn("NMA error: " + error);
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
