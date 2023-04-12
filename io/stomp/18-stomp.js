
module.exports = function(RED) {
    "use strict";
    var StompClient = require('stomp-client');
    var querystring = require('querystring');

    function StompServerNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.port = n.port;
        this.protocolversion = n.protocolversion;
        this.ack = n.ack;
        this.vhost = n.vhost;
        this.reconnectretries = n.reconnectretries || 999999;
        this.reconnectdelay = (n.reconnectdelay || 15) * 1000;
        this.name = n.name;
        this.username = this.credentials.user;
        this.password = this.credentials.password;
        this.clientConnection = null;
        this.connected = false;
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
        this.enableSubscriptionId = n.enable_subscriptionid;
        this.subscriptionid = n.subscriptionid;

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

        this.subscribeHeaders = {};
        if (this.enableSubscriptionId) {
            this.subscribeHeaders.id = this.subscriptionid;
        }
        if (this.serverConfig.ack) {
            this.subscribeHeaders.ack = "client";
        }

        var node = this;
        var msg = {topic:this.topic};
        // Save the client connection to the shared server instance if needed
        if (!node.serverConfig.clientConnection) {
            node.serverConfig.clientConnection = new StompClient(node.stompClientOpts);
        }
        node.client = node.serverConfig.clientConnection;

        node.client.on("connect", function() {
            node.status({fill:"green",shape:"dot",text:"connected"});
            node.serverConfig.connected = true;
        });

        node.client.on("reconnecting", function() {
            node.status({fill:"red",shape:"ring",text:"reconnecting"});
            node.warn("reconnecting");
            node.serverConfig.connected = false;
        });

        node.client.on("reconnect", function() {
            node.status({fill:"green",shape:"dot",text:"connected"});
            node.serverConfig.connected = true;
        });

        node.client.on("error", function(error) {
            node.status({fill:"grey",shape:"dot",text:"error"});
            node.warn(error);
        });

        // Connect to server if needed and subscribe
        node.status({fill:"grey",shape:"ring",text:"connecting"});

        function subscribe() {
            node.log('subscribing to: '+node.topic);
            node.client.subscribe(node.topic, node.subscribeHeaders, function(body, headers) {
                var newmsg={"headers":headers,"topic":node.topic}
                try {
                    newmsg.payload = JSON.parse(body);
                }
                catch(e) {
                    newmsg.payload = body;
                }
                node.send(newmsg);
            });
        }

        if (!node.server.connected) {
            node.client.connect(function(sessionId) {
                subscribe();
            }, function(error) {
                node.status({fill:"grey",shape:"dot",text:"error"});
                node.warn(error);
            });
        } else {
            subscribe();
        }
        

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
        // Save the client connection to the shared server instance if needed
        if (!node.serverConfig.clientConnection) {
            node.serverConfig.clientConnection = new StompClient(node.stompClientOpts);
        }
        node.client = node.serverConfig.clientConnection;

        node.client.on("connect", function() {
            node.status({fill:"green",shape:"dot",text:"connected"});
            node.serverConfig.connected = true;
        });

        node.client.on("reconnecting", function() {
            node.status({fill:"red",shape:"ring",text:"reconnecting"});
            node.warn("reconnecting");
            node.serverConfig.connected = false;
        });

        node.client.on("reconnect", function() {
            node.status({fill:"green",shape:"dot",text:"connected"});
            node.serverConfig.connected = true;
        });

        node.client.on("error", function(error) {
            node.status({fill:"grey",shape:"dot",text:"error"});
            node.warn(error);
        });

        // Connect to server if needed
        node.status({fill:"grey",shape:"ring",text:"connecting"});
        if(!node.serverConfig.connected) {
            node.client.connect(function(sessionId) {}, function(error) {
                node.status({fill:"grey",shape:"dot",text:"error"});
                node.warn(error);
            });
        }

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

    function StompAckNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;

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

        // only start connection etc. when acknowledgements are configured to be send by client
        if (node.serverConfig.ack) {
            // Save the client connection to the shared server instance if needed
            if (!node.serverConfig.clientConnection) {
                node.serverConfig.clientConnection = new StompClient(node.stompClientOpts);
            }
            node.client = node.serverConfig.clientConnection;

            node.client.on("connect", function() {
                node.status({fill:"green",shape:"dot",text:"connected"});
                node.serverConfig.connected = true;
            });

            node.client.on("reconnecting", function() {
                node.status({fill:"red",shape:"ring",text:"reconnecting"});
                node.warn("reconnecting");
                node.serverConfig.connected = false;
            });

            node.client.on("reconnect", function() {
                node.status({fill:"green",shape:"dot",text:"connected"});
                node.serverConfig.connected = true;
            });

            node.client.on("error", function(error) {
                node.status({fill:"grey",shape:"dot",text:"error"});
                node.warn(error);
            });

            // Connect to server if needed
            node.status({fill:"grey",shape:"ring",text:"connecting"});
            if(!node.serverConfig.connected) {
                node.client.connect(function(sessionId) {}, function(error) {
                    node.status({fill:"grey",shape:"dot",text:"error"});
                    node.warn(error);
                });
            }

            node.on("input", function(msg) {
                node.client.ack(msg.messageId, msg.subsriptionId, msg.transaction);
            });

            node.on("close", function(done) {
                if (node.client) {
                    // disconnect can accept a callback - but it is not always called.
                    node.client.disconnect();
                }
                done();
            });
        } else {
            node.error("ACK not configured in server (config node)");
        }
    }
    RED.nodes.registerType("stomp ack",StompAckNode);

};
