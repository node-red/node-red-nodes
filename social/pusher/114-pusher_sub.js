/**
 * pusher_sub.js
 * Subscription module for the Pusher service (www.pusher.com)
 * Requires 'pusher-client' module
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


var Pusher = require('pusher-client');

// Require main module
var RED = require(process.env.NODE_RED_HOME+"/red/red");


// The main node definition - most things happen in here
function PusherNode(n) {
    // Create a RED node
    RED.nodes.createNode(this,n);

    var node = this;

    //get parameters from user
    this.apikey = n.apikey;
    this.channel = n.channel;
    this.eventname = n.eventname;


    
    //create a subscription to the channel and event defined by user
    var socket = new Pusher(''+this.apikey);
    var my_channel = socket.subscribe(''+this.channel);
    socket.bind(''+this.eventname,
        function(data) {
    
            var msg = {};
            msg.payload = data;
            node.send(msg);
        }
    );

    this.on("input", function(msg){
            
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
RED.nodes.registerType("Pusher",PusherNode);
