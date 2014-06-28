/**
 * Copyright 2013 IBM Corp.
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
    var Prowl = require('node-prowl');
    var util = require('util');

    // Either add a line like this to settings.js
    //    prowl: {prowlkey:'My-API-KEY'},
    // or create pushkey.js in dir ABOVE node-red, it just needs to be like
    //    module.exports = {prowlkey:'My-API-KEY'}

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
        var credentials = RED.nodes.getCredentials(n.id);
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
            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else { msg.payload = msg.payload.toString(); }
            if (node.pushkey) {
                try {
                    node.prowl.push(msg.payload, titl, { priority: pri }, function(err, remaining) {
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
    RED.nodes.registerType("prowl",ProwlNode);

    var querystring = require('querystring');

    RED.httpAdmin.get('/prowl/:id',function(req,res) {
        var credentials = RED.nodes.getCredentials(req.params.id);
        if (credentials) {
            res.send(JSON.stringify({hasPassword:(credentials.pushkey&&credentials.pushkey!=="")}));
        }
        else if (pushkeys && pushkeys.prowlkey) {
            RED.nodes.addCredentials(req.params.id,{pushkey:pushkeys.prowlkey,global:true});
            credentials = RED.nodes.getCredentials(req.params.id);
            res.send(JSON.stringify({hasPassword:(credentials.pushkey&&credentials.pushkey!==""),global:credentials.global}));
        }
        else {
            res.send(JSON.stringify({}));
        }
    });

    RED.httpAdmin.delete('/prowl/:id',function(req,res) {
        RED.nodes.deleteCredentials(req.params.id);
        res.send(200);
    });

    RED.httpAdmin.post('/prowl/:id',function(req,res) {
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
