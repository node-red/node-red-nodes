
module.exports = function(RED) {
    "use strict";
    var Pusher = require('pusher');
    var PusherClient = require('pusher-client');

    //node for subscribing to an event/channel
    function PusherNode(n) {
        RED.nodes.createNode(this,n);
        this.channel = n.channel;
        this.eventname = n.eventname;
        this.cluster = n.cluster || "mt1";
        var node = this;
        var credentials = this.credentials;

        if ((credentials) && (credentials.hasOwnProperty("pusherappkeysub"))) {
            node.appkey = credentials.pusherappkeysub;
        }
        else { this.error("No Pusher app key set for input node"); }

        //create a subscription to the channel and event defined by user
        var socket = new PusherClient(''+node.appkey, {cluster:node.cluster, encrypted:true});
        var chan = socket.subscribe(''+node.channel);
        chan.bind(''+node.eventname,
            function(data) {
                var msg = {topic:node.eventname, channel:node.channel};
                if (data.hasOwnProperty("payload")) { msg.payload = data.payload; }
                else { msg.payload = data; }
                node.send(msg);
            }
        );

        node.on("close", function() {
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
        this.cluster = n.cluster || "mt1";

        var pusherd = new Pusher({
            appId: this.appid,
            key: this.appkey,
            secret: this.appsecret,
            cluster: this.cluster
        });

        node.on("input", function(msg) {
            pusherd.trigger(this.channel, this.eventname, {
                "payload": msg.payload
            });
        });

        node.on("close", function() {
        });
    }

    RED.nodes.registerType("pusher in",PusherNode,{
        credentials: {
            pusherappkeysub: "text"
        }
    });
    RED.nodes.registerType("pusher out",PusherNodeSend,{
        credentials: {
            pusherappid: {type:"text"},
            pusherappkey: {type:"text"},
            pusherappsecret: {type:"password"}
        },
        encrypted: true
    });
}
