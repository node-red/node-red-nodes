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
    var PushBullet = require('pushbullet');
    var util = require('util');

    // Either create pushkey.js in dir ABOVE node-red, it just needs to be like
    // module.exports = {pushbullet:'My-API-KEY', deviceid:'12345'}
    // or set them per node in the edit dialog

    try {
        var pushkeys = RED.settings.pushbullet || require(process.env.NODE_RED_HOME+"/../pushkey.js");
    }
    catch(err) {
        //util.log("[57-pushbullet.js] Warning: Failed to load global PushBullet credentials");
    }

    function PushbulletNode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        var credentials = RED.nodes.getCredentials(n.id);
        if ((credentials) && (credentials.hasOwnProperty("pushkey"))) { this.pushkey = credentials.pushkey; }
        else {
            if (pushkeys) { this.pushkey = pushkeys.pushbullet; }
            else { this.error("No Pushbullet API key set"); }
        }
        if ((credentials) && (credentials.hasOwnProperty("deviceid"))) { this.deviceid = credentials.deviceid; }
        else {
            if (pushkeys) { this.deviceid = pushkeys.deviceid; }
            else { this.warn("No deviceid set"); }
        }
        this.pusher = new PushBullet(this.pushkey);
        var node = this;

        this.on("input",function(msg) {
            var titl = node.title||msg.topic||"Node-RED";
            var dev = msg.deviceid||node.deviceid;
            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else { msg.payload = msg.payload.toString(); }
            if (node.pushkey && dev) {
                try {
                    if (!isNaN(dev)) { dev = Number(dev); }
                    node.pusher.note(dev, titl, msg.payload, function(err, response) {
                        if (err) { node.error("Pushbullet error: "+err); }
                        //console.log(response);
                    });
                }
                catch (err) {
                    node.error(err);
                }
            }
            else {
                node.warn("Pushbullet credentials not set/found. See node info.");
            }
        });
    }
    RED.nodes.registerType("pushbullet",PushbulletNode);

    var querystring = require('querystring');

    RED.httpAdmin.get('/pushbullet/:id',function(req,res) {
        var credentials = RED.nodes.getCredentials(req.params.id);
        if (credentials) {
            res.send(JSON.stringify({deviceid:credentials.deviceid,hasPassword:(credentials.pushkey&&credentials.pushkey!=="")}));
        }
        else if (pushkeys && pushkeys.pushbullet && pushkeys.deviceid) {
            RED.nodes.addCredentials(req.params.id,{pushkey:pushkeys.pushbullet,deviceid:pushkeys.deviceid,global:true});
            credentials = RED.nodes.getCredentials(req.params.id);
            res.send(JSON.stringify({deviceid:credentials.deviceid,global:credentials.global,hasPassword:(credentials.pushkey&&credentials.pushkey!=="")}));
        }
        else {
            res.send(JSON.stringify({}));
        }
    });

    RED.httpAdmin.delete('/pushbullet/:id',function(req,res) {
        RED.nodes.deleteCredentials(req.params.id);
        res.send(200);
    });

    RED.httpAdmin.post('/pushbullet/:id',function(req,res) {
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
