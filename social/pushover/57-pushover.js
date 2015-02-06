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
        var credentials = this.credentials;
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
    RED.nodes.registerType("pushover",PushoverNode,{
        credentials: {
            deviceid: {type:"text"},
            pushkey: {type: "password"}
        }       
    });
}
