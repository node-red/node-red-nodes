/**
 * Copyright 2014, 2015 Andrew D Lindsay @AndrewDLindsay
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

module.exports = function(RED) {
    "use strict";
    var twilio = require('twilio');

    try {
        var twiliokey = RED.settings.twilio || require(process.env.NODE_RED_HOME+"/../twiliokey.js");
    }
    catch(err) {
    }

    RED.httpAdmin.get('/twilio-api/global', RED.auth.needsPermission("twilio.read"), function(req,res) {
        res.json({hasToken:!(twiliokey && twiliokey.account && twiliokey.authtoken)});
    });

    function TwilioAPINode(n) {
        RED.nodes.createNode(this,n);
        this.sid = n.sid;
        this.from = n.from;
        this.name = n.name;
        var credentials = this.credentials;
        if (credentials) {
            this.token = credentials.token;
        }
    }
    RED.nodes.registerType("twilio-api",TwilioAPINode,{
        credentials: {
            token: "password"
        }
    });


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

        this.twilioType = n.twilioType;
        this.url = n.url;
        var node = this;
        this.on("input",function(msg) {
            if (typeof(msg.payload) == 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            try {
                // decide if we are to Send SMS
                var tonum = node.number || msg.topic;
                if ( this.twilioType == "call" ) {
                    // Make a call
                    var twimlurl = node.url || msg.payload;
                    node.twilioClient.makeCall( {to: tonum, from: node.fromNumber, url: twimlurl}, function(err, response) {
                        if (err) {
                            node.error(err.message);
                        }
                        //console.log(response);
                    });
                } else {
                    // Send SMS
                    node.twilioClient.sendMessage( {to: tonum, from: node.fromNumber, body: msg.payload}, function(err, response) {
                        if (err) {
                            node.error(err.message);
                        }
                        //console.log(response);
                    });
                }

            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType("twilio out",TwilioOutNode);
}
