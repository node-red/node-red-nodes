/**
* pusher.js
* Subscription module for the Pusher service (www.pusher.com)
* Requires 'pusher' and 'pusher-client' modules.
*
* Copyright 2014, 2015 Charalampos Doukas, @BuildingIoT
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
    var Pusher = require('pusher');
    var PusherClient = require('pusher-client');

    //node for subscribing to an event/channel
    function PusherNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        var node = this;
        var credentials = this.credentials;

        if ((credentials) && (credentials.hasOwnProperty("pusherappkey_sub"))) { this.appkey = credentials.pusherappkey_sub; }
        else { this.error("No Pusher app key set for input node"); }

        //get parameters from user
        this.channel = n.channel;
        this.eventname = n.eventname;

        //create a subscription to the channel and event defined by user
        var socket = new PusherClient(''+this.appkey);
        var my_channel = socket.subscribe(''+this.channel);
        socket.bind(''+this.eventname,
            function(data) {
                var msg = {topic:this.eventname};
                if (data.hasOwnProperty("payload")) { msg.payload = data.payload; }
                else { msg.payload = data; }
                node.send(msg);
            }
        );

        this.on("close", function() {
            socket.disconnect();
        });
    }

    //Node for sending Pusher events
    function PusherNodeSend(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        var node = this;

        var credentials = this.credentials;

        if ((credentials) && (credentials.hasOwnProperty("pusherappid"))) { this.appid = credentials.pusherappid; }
        else { this.error("No Pusher api token set"); }
        if ((credentials) && (credentials.hasOwnProperty("pusherappsecret"))) { this.appsecret = credentials.pusherappsecret; }
        else { this.error("No Pusher user secret set"); }
        if ((credentials) && (credentials.hasOwnProperty("pusherappkey"))) { this.appkey = credentials.pusherappkey; }
        else { this.error("No Pusher user key set"); }

        //get parameters from user
        this.channel = n.channel;
        this.eventname = n.eventname;

        var pusher = new Pusher({
            appId: this.appid,
            key: this.appkey,
            secret: this.appsecret
        });

        this.on("input", function(msg) {
            pusher.trigger(this.channel, this.eventname, {
                "payload": msg.payload
            });
        });

        this.on("close", function() {
        });
    }

    //debugging on the output:
    var displayResult = function(result) {
        node.log(result);
    };

    var displayError = function(err) {
        node.log("Error: "+err);
    };

    RED.nodes.registerType("pusher in",PusherNode,{
        credentials: {
            pusherappkey_sub: "text"
        }
    });
    RED.nodes.registerType("pusher out",PusherNodeSend,{
        credentials: {
            pusherappid: {type:"text"},
            pusherappkey: {type:"text"},
            pusherappsecret: {type:"password"}
        }
    });
}
