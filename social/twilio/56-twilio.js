
module.exports = function(RED) {
    "use strict";
    var twilio = require('twilio');

    try {
        var twiliokey = RED.settings.twilio || require(process.env.NODE_RED_HOME+"/../twiliokey.js");
    }
    catch(err) {
    }

    RED.httpAdmin.get('/twilio-api/global', RED.auth.needsPermission("twilio.read"), function(req,res) {
        res.json({hasToken:!!(twiliokey && twiliokey.account && twiliokey.authtoken)});
    });

    function TwilioAPINode(n) {
        RED.nodes.createNode(this,n);
        this.sid = n.sid;
        this.from = n.from;
        this.name = n.name;
        var credentials = this.credentials;
        if (credentials) { this.token = credentials.token; }
    }
    RED.nodes.registerType("twilio-api",TwilioAPINode,{
        credentials: { token:"password" }
    });


    function TwilioOutNode(n) {
        RED.nodes.createNode(this,n);
        this.number = n.number;

        this.api = RED.nodes.getNode(n.twilio);

        if (this.api) {
            this.twilioClient = twilio(this.api.sid,this.api.token);
            this.fromNumber = this.api.from;
        }
        else if (twiliokey) {
            this.twilioClient = twilio(twiliokey.account, twiliokey.authtoken);
            this.fromNumber = twiliokey.from;
        }
        else {
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
                    node.twilioClient.calls.create({to: tonum, from: node.fromNumber, url: twimlurl}).catch(function(err) {
                        node.error(err.message,msg);
                    });
                }
                else {
                    // Send SMS
                    node.twilioClient.messages.create({to: tonum, from: node.fromNumber, body: msg.payload}).catch( function(err) {
                        node.error(err.message,msg);
                    });
                }
            }
            catch (err) {
                node.error(err,msg);
            }
        });
    }
    RED.nodes.registerType("twilio out",TwilioOutNode);
}
