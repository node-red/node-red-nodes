/**
 * Copyright 2013 Andrew D Lindsay @AndrewDLindsay
 * http://blog.thiseldo.co.uk
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

var RED = require(process.env.NODE_RED_HOME+"/red/red");
var util = require('util');
var twilio = require('twilio');

try {
    var twiliokey = RED.settings.twilio || require(process.env.NODE_RED_HOME+"/../twiliokey.js");
}
catch(err) {
}

var querystring = require('querystring');

RED.httpAdmin.get('/twilio-api/global',function(req,res) {
    res.send(JSON.stringify({hasToken:!(twiliokey && twiliokey.account && twiliokey.authtoken)}));
});
RED.httpAdmin.get('/twilio-api/:id',function(req,res) {
    var credentials = RED.nodes.getCredentials(req.params.id);
    if (credentials) {
        res.send(JSON.stringify({hasToken:(credentials.token&&credentials.token!="")}));
    } else {
        res.send(JSON.stringify({}));
    }
});

RED.httpAdmin.delete('/twilio-api/:id',function(req,res) {
    RED.nodes.deleteCredentials(req.params.id);
    res.send(200);
});

RED.httpAdmin.post('/twilio-api/:id',function(req,res) {
    var body = "";
    req.on('data', function(chunk) {
        body+=chunk;
    });
    req.on('end', function(){
        var newCreds = querystring.parse(body);
        var credentials = RED.nodes.getCredentials(req.params.id)||{};
        if (newCreds.token == "") {
            delete credentials.token;
        } else {
            credentials.token = newCreds.token;
        }
        RED.nodes.addCredentials(req.params.id,credentials);
        res.send(200);
    });
});

function TwilioAPINode(n) {
    RED.nodes.createNode(this,n);
    this.sid = n.sid;
    this.from = n.from;
    this.name = n.name;
    var credentials = RED.nodes.getCredentials(n.id);
    if (credentials) {
        this.token = credentials.token;
    }
}
RED.nodes.registerType("twilio-api",TwilioAPINode);

    
function TwilioOutNode(n) {
    RED.nodes.createNode(this,n);
    this.number = n.number;
    
    this.api = RED.nodes.getNode(n.twilio);
    
    if (this.api) {
        this.twilioClient = twilio(this.api.sid,this.api.token);
        this.fromNumber = this.api.from;
    } else if (twiliokey) {
        this.twilioClient = twilio(twiliokey.account, twiliokey.authtoken);
        this.fromNumber = twiliokey.from;
    } else {
        this.error("missing twilio credentials");
        return;
    }
    
    var node = this;
    this.on("input",function(msg) {
        if (typeof(msg.payload) == 'object') {
            msg.payload = JSON.stringify(msg.payload);
        }
        try {
            // Send SMS
            var tonum = node.number || msg.topic;
            node.twilioClient.sendMessage( {to: tonum, from: node.fromNumber, body: msg.payload}, function(err, response) {
                if (err) {
                    node.error(err);
                }
                //console.log(response);
            });
        } catch (err) {
            node.error(err);
        }
    });
}
RED.nodes.registerType("twilio out",TwilioOutNode);
