
module.exports = function(RED) {
    "use strict";
    var StompClient = require('stomp-client');
    var querystring = require('querystring');

    function StompServerNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.port = n.port;
        this.protocolversion = n.protocolversion;
        this.vhost = n.vhost;
        this.reconnectretries = n.reconnectretries;
        this.reconnectdelay = n.reconnectdelay * 1000;
        this.name = n.name;
        this.username = this.credentials.user;
        this.password = this.credentials.password;
    }
    RED.nodes.registerType("stomp-server",StompServerNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

    function StompInNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.topic = n.topic;

        this.serverConfig = RED.nodes.getNode(this.server);
        this.stompClientOpts = {
            address: this.serverConfig.server,
            port: this.serverConfig.port * 1,
            user: this.serverConfig.username,
            pass: this.serverConfig.password,
            protocolVersion: this.serverConfig.protocolversion,
            reconnectOpts: {
                retries: this.serverConfig.reconnectretries * 1,
                delay: this.serverConfig.reconnectdelay * 1
            }
        };
        if (this.serverConfig.vhost) {
          this.stompClientOpts.vhost = this.serverConfig.vhost;
        }

        var node = this;
        var msg = {topic:this.topic};
        node.client = new StompClient(node.stompClientOpts);

        node.client.on("connect", function() {
          node.status({fill:"green",shape:"dot",text:"connected"});
        });

        node.client.on("reconnecting", function() {
            node.status({fill:"red",shape:"ring",text:"reconnecting"});
            node.warn("reconnecting");
        });

        node.client.on("error", function(error) {
            node.status({fill:"grey",shape:"dot",text:"error"});
            node.warn(error);
        });

        node.status({fill:"grey",shape:"ring",text:"connecting"});
        node.client.connect(function(sessionId) {
            node.log('subscribing to: '+node.topic);
            node.client.subscribe(node.topic, function(body, headers) {
                try {
                    msg.payload = JSON.parse(body);
                }
                catch(e) {
                    msg.payload = body;
                }
                msg.headers = headers;
                msg.topic = node.topic;
                node.send(msg);
            });
        }, function(error) {
            node.status({fill:"grey",shape:"dot",text:"error"});
            node.warn(error);
        });

        node.on("close", function(done) {
            if (node.client) {
                // disconnect can accept a callback - but it is not always called.
                node.client.disconnect();
            }
            done();
        });
    }
    RED.nodes.registerType("stomp in",StompInNode);


    function StompOutNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.topic = n.topic;

        this.serverConfig = RED.nodes.getNode(this.server);
        this.stompClientOpts = {
            address: this.serverConfig.server,
            port: this.serverConfig.port * 1,
            user: this.serverConfig.username,
            pass: this.serverConfig.password,
            protocolVersion: this.serverConfig.protocolversion,
            reconnectOpts: {
                retries: this.serverConfig.reconnectretries * 1,
                delay: this.serverConfig.reconnectdelay * 1
            }
        };
        if (this.serverConfig.vhost) {
          this.stompClientOpts.vhost = this.serverConfig.vhost;
        }

        var node = this;
        node.client = new StompClient(node.stompClientOpts);

        node.client.on("connect", function() {
          node.status({fill:"green",shape:"dot",text:"connected"});
        });

        node.client.on("reconnecting", function() {
            node.status({fill:"red",shape:"ring",text:"reconnecting"});
            node.warn("reconnecting");
        });

        node.client.on("error", function(error) {
            node.status({fill:"grey",shape:"dot",text:"error"});
            node.warn(error);
        });

        node.status({fill:"grey",shape:"ring",text:"connecting"});
        node.client.connect(function(sessionId) {
        }, function(error) {
            node.status({fill:"grey",shape:"dot",text:"error"});
            node.warn(error);
        });

        node.on("input", function(msg) {
            node.client.publish(node.topic || msg.topic, msg.payload, msg.headers);
        });

        node.on("close", function(done) {
            if (node.client) {
                // disconnect can accept a callback - but it is not always called.
                node.client.disconnect();
            }
            done();
        });
    }
    RED.nodes.registerType("stomp out",StompOutNode);

};
