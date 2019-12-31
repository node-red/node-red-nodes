
module.exports = function(RED) {
    "use strict";
    var PushOver = require('pushover-notifications');
    var util = require('util');
    var fs = require('fs');

    function PushoverNode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        this.device = n.device;
        this.priority = n.priority;
        this.sound = n.sound;
        this.html = n.html;
        if (this.sound === '') { this.sound = null; }
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
            var title = node.title || msg.topic || "Node-RED";
            var pri = node.priority || msg.priority || 0;
            var dev = node.device || msg.device;
            var sound = node.sound || msg.sound || null;
            var url = node.url || msg.url || null;
            var url_title = node.url_title || msg.url_title || null;
            var html = node.html || false;
            var attachment = msg.attachment || null;
            if (isNaN(pri)) {pri=0;}
            if (pri > 2) {pri = 2;}
            if (pri < -2) {pri = -2;}
            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else { msg.payload = msg.payload.toString(); }
            if (pusher) {
                var pushmsg = {
                    message: msg.payload,
                    title: title,
                    priority: pri,
                    retry: 30,
                    expire: 600,
                    html: html
                };
                if (dev) { pushmsg.device = dev; }
                if (typeof(sound) === 'string') { pushmsg.sound = sound; }
                if (typeof(url) === 'string') { pushmsg.url = url; }
                if (typeof(url_title) === 'string') { pushmsg.url_title = url_title; }
                if (html) { pushmsg.html = 1; }
                if (typeof(attachment) === 'string') {
                    // Treat attachment as a path
                    fs.readFile(attachment,function(err, data) {
                        if (err) {
                            node.error("[57-pushover.js] Error: File Read Error: "+err);
                            return;
                        }
                        pushmsg.file = { data: data };
                        pushMessage(pushmsg);
                    });
                    return;
                }
                else if (attachment instanceof Buffer) {
                    // Is it base64 encoded or binary?
                    var attachmentString = attachment.toString();
                    var attachmentBuffer = Buffer.from(attachmentString,'base64');
                    if (attachmentString === attachmentBuffer.toString('base64')) {
                        // If converts back to same, then it was base64 so set to binary
                        // https://stackoverflow.com/a/48770228
                        attachment = attachmentBuffer;
                    }
                    // Unset these temporary values
                    attachmentBuffer = attachmentString = undefined;
                    // attach the buffer
                    pushmsg.file = { data: attachment };
                }
                else if (attachment) {
                    node.error("[57-pushover.js] Error: attachment property must be a path to a local file or a Buffer containing an image");
                    return;
                }
                pushMessage(pushmsg);
            }
            else {
                node.warn("Pushover credentials not set.");
            }
        });

        function pushMessage(pushmsg) {
            pusher.send( pushmsg, function(err, response) {
                if (err) { node.error(err); }
                else {
                    try {
                        response = JSON.parse(response);
                        if (response.status !== 1) { node.error("[57-pushover.js] Error: "+response); }
                    }
                    catch(e) {
                        node.error("[57-pushover.js] Error: "+response);
                    }
                }
            });
        }
    }
    RED.nodes.registerType("pushover",PushoverNode,{
        credentials: {
            deviceid: {type:"text"},
            pushkey: {type: "password"}
        }
    });
}
