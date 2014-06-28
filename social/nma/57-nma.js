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
    var util = require('util');

    function NMANode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        var credentials = RED.nodes.getCredentials(n.id);
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
                try {
                    nma(node.pushkey, "Node-RED", titl, msg.payload, 0 );
                } catch (e) {
                    node.warn("NMA error: "+ e);
                }
            }
            else {
                node.warn("NMA credentials not set.");
            }
        });
    }

    RED.nodes.registerType("nma",NMANode);

    var querystring = require('querystring');

    RED.httpAdmin.get('/nma/:id',function(req,res) {
        var credentials = RED.nodes.getCredentials(req.params.id);
        if (credentials) {
            res.send(JSON.stringify({hasPassword:(credentials.pushkey&&credentials.pushkey!=="")}));
        } else {
            res.send(JSON.stringify({}));
        }
    });

    RED.httpAdmin.delete('/nma/:id',function(req,res) {
        RED.nodes.deleteCredentials(req.params.id);
        res.send(200);
    });

    RED.httpAdmin.post('/nma/:id',function(req,res) {
        var body = "";
        req.on('data', function(chunk) {
            body+=chunk;
        });
        req.on('end', function(){
            var newCreds = querystring.parse(body);
            var credentials = RED.nodes.getCredentials(req.params.id)||{};
            if (newCreds.pushkey === "") {
                delete credentials.pushkey;
            } else {
                credentials.pushkey = newCreds.pushkey||credentials.pushkey;
            }
            RED.nodes.addCredentials(req.params.id,credentials);
            res.send(200);
        });
    });
}
