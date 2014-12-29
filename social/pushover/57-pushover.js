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
    var PushOver = require('pushover-notifications');
    var util = require('util');

    function PushoverNode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        this.priority = n.priority;
        var credentials = RED.nodes.getCredentials(n.id);
        if ((credentials) && (credentials.hasOwnProperty("pushkey"))) { this.pushkey = credentials.pushkey; }
        else { this.error("No Pushover api token set"); }
        if ((credentials) && (credentials.hasOwnProperty("deviceid"))) { this.deviceid = credentials.deviceid; }
        else { this.error("No Pushover user key set"); }
        var pusher = false;
        if (this.pushkey && this.deviceid) {
            pusher = new PushOver({
                user: this.deviceid,
                token: this.pushkey,
                onerror: function(err) {
                    util.log('[57-pushover.js] Error: '+err);
                }
            });
        }
        var node = this;

        this.on("input",function(msg) {
            var titl = this.title || msg.topic || "Node-RED";
            var pri = this.priority || msg.priority || 0;
            if (isNaN(pri)) {pri=0;}
            if (pri > 2) {pri = 2;}
            if (pri < -1) {pri = -1;}
            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else { msg.payload = msg.payload.toString(); }
            if (pusher) {
                var pushmsg = {
                    message: msg.payload,
                    title: titl,
                    priority: pri,
                    retry: 30,
                    expire: 600
                };
                //console.log("Sending",pushmsg);
                pusher.send( pushmsg, function(err, response) {
                    if (err) { node.error("Pushover Error: "+err); }
                    //console.log(response);
                });
            }
            else {
                node.warn("Pushover credentials not set.");
            }
        });
    }
    RED.nodes.registerType("pushover",PushoverNode);

    var querystring = require('querystring');

    RED.httpAdmin.get('/pushover/:id',function(req,res) {
        var credentials = RED.nodes.getCredentials(req.params.id);
        if (credentials) {
            res.send(JSON.stringify({deviceid:credentials.deviceid,hasPassword:(credentials.pushkey&&credentials.pushkey!=="")}));
        } else {
            res.send(JSON.stringify({}));
        }
    });

    RED.httpAdmin.delete('/pushover/:id',function(req,res) {
        RED.nodes.deleteCredentials(req.params.id);
        res.send(200);
    });

    RED.httpAdmin.post('/pushover/:id',function(req,res) {
        var body = "";
        req.on('data', function(chunk) {
            body+=chunk;
        });
        req.on('end', function(){
            var newCreds = querystring.parse(body);
            var credentials = RED.nodes.getCredentials(req.params.id)||{};
            if (newCreds.deviceid === null || newCreds.deviceid === "") {
                delete credentials.deviceid;
            } else {
                credentials.deviceid = newCreds.deviceid;
            }
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
