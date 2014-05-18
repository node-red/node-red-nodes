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
var PusherClient = require('pusher-client');

// Require main module
var RED = require(process.env.NODE_RED_HOME+"/red/red");


// The main node definition - most things happen in here
//Node for sending Pusher events
function PusherNodeSend(n) {
    // Create a RED node
    RED.nodes.createNode(this,n);

    var node = this;

    var credentials = RED.nodes.getCredentials(n.id);

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

//node for subscribing to an event/channel
 function PusherNode(n) {
    // Create a RED node
    RED.nodes.createNode(this,n);

    var node = this;
    var credentials = RED.nodes.getCredentials(n.id);

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
        socket.disconnect();
    });

 }

 //debugging on the output:
 var displayResult = function(result) {
    console.log(result);
};

var displayError = function(err) {
    console.error(err);
};




// Register the node by name. This must be called before overriding any of the
// Node functions.
RED.nodes.registerType("Pusher out",PusherNodeSend);
RED.nodes.registerType("Pusher",PusherNode);

var querystring = require('querystring');

RED.httpAdmin.get('/pusher/:id',function(req,res) {
    var credentials = RED.nodes.getCredentials(req.params.id);
    if (credentials) {
        res.send(JSON.stringify({pusherappid:credentials.pusherappid,pusherappsecret:credentials.pusherappsecret, pusherappkey:credentials.pusherappkey, pusherappkey_sub:credentials.pusherappkey_sub}));
    } else {
        res.send(JSON.stringify({}));
    }
});

RED.httpAdmin.delete('/pusher/:id',function(req,res) {
    RED.nodes.deleteCredentials(req.params.id);
    res.send(200);
});

RED.httpAdmin.post('/pusher/:id',function(req,res) {
    var body = "";
    req.on('data', function(chunk) {
        body+=chunk;
    });
    req.on('end', function(){
        var newCreds = querystring.parse(body);
        var credentials = RED.nodes.getCredentials(req.params.id)||{};
        
        if (newCreds.pusherappid == null || newCreds.pusherappid == "") {
            delete credentials.pusherappid;
        } else {
            credentials.pusherappid = newCreds.pusherappid;
        }
        if (newCreds.pusherappkey == "") {
            delete credentials.pusherappkey;
        } else {
            credentials.pusherappkey = newCreds.pusherappkey||credentials.pusherappkey;
        }

        if (newCreds.pusherappsecret == "") {
            delete credentials.pusherappsecret;
        } else {
            credentials.pusherappsecret = newCreds.pusherappsecret||credentials.pusherappsecret;
        }

        if (newCreds.pusherappkey_sub == "") {
            delete credentials.pusherappkey_sub;
        } else {
            credentials.pusherappkey_sub = newCreds.pusherappkey_sub||credentials.pusherappkey_sub;
        }


        RED.nodes.addCredentials(req.params.id,credentials);
        res.send(200);
    });
});

