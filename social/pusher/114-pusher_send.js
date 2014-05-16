/**
 * pusher_send.js
 * Subscription module for the Pusher service (www.pusher.com)
 * Requires 'pusher' module
 * Copyright 2014 Charalampos Doukas - @BuildingIoT
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


var Pusher = require('pusher');

// Require main module
var RED = require(process.env.NODE_RED_HOME+"/red/red");


// The main node definition - most things happen in here
function PusherNodeSend(n) {
    // Create a RED node
    RED.nodes.createNode(this,n);

    var node = this;

    //get parameters from user
    this.appid = n.appid;
    this.appkey = n.appkey;
    this.appsecret = n.appsecret;
    this.channel = n.channel;
    this.eventname = n.eventname;


    var pusher = new Pusher({
            appId: this.appid,
            key: this.appkey,
            secret: this.appsecret
    });


    this.on("input", function(msg){
        
        pusher.trigger(this.channel, this.eventname, {
            "message": ""+msg.payload
        });
            
    });


    this.on("close", function() {
        // Called when the node is shutdown - eg on redeploy.
        // Allows ports to be closed, connections dropped etc.
        // eg: this.client.disconnect();
    });

 }

 //hue debugging on the output:
 var displayResult = function(result) {
    console.log(result);
};

var displayError = function(err) {
    console.error(err);
};




// Register the node by name. This must be called before overriding any of the
// Node functions.
RED.nodes.registerType("Pusher out",PusherNodeSend);
