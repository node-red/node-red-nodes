
module.exports = function(RED) {
    "use strict";
    var mqlight = require('mqlight');
    var util = require("util");

    function MQLightServiceNode(n) {
        RED.nodes.createNode(this,n);

        var id = "mqlight_" + (n.clientid ? n.clientid : (1+Math.random()*4294967295).toString(16));

        var opts = {
            service: n.service,
            id: id
        };

        if (this.credentials) {
            opts.user = this.credentials.user;
            opts.password = this.credentials.password;
        }

        this.client = mqlight.createClient(opts, function(err) {
            if (err) {
                util.log('[mqlight] ['+id+'] not connected to service '+n.service);
            }
            else {
                util.log('[mqlight] ['+id+'] connected to service '+n.service);
            }
        });
        this.client.on("error", function(err) {
            if (err) { util.log('[mqlight] ['+id+'] '+ err.toString()); }
        });
    }
    RED.nodes.registerType("mqlight service",MQLightServiceNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

    function MQLightIn(n) {
        RED.nodes.createNode(this, n);
        this.topic = n.topic || "";
        this.share = n.share || null;
        this.service = n.service;
        this.serviceConfig = RED.nodes.getNode(this.service);
        var node = this;

        if (node.serviceConfig) {
            if (node.serviceConfig.client) {
                var recvClient = node.serviceConfig.client;
                recvClient.on("error", function(err) {
                    if (err) { node.error(err.toString()); }
                });
                recvClient.on("started", function() {
                    recvClient.on("message", function(data, delivery) {
                        if (node.topic === delivery.destination.topicPattern) {
                            var msg = {
                                topic: delivery.message.topic,
                                payload: data,
                                _session: {
                                    type: "mqlight",
                                    id: recvClient.id
                                }
                            };
                            if (delivery.destination.share) {
                                msg.share = delivery.destination.share;
                            }
                            node.send(msg);
                        }
                    });
                    var subscribeCallback = function(err) {
                        if (err) {
                            node.error("Failed to subscribe: " + err);
                        }
                        else {
                            node.log("Subscribed to "+node.topic+(node.share?" ["+node.share+"]":""));
                        }
                    };
                    if (node.share) {
                        recvClient.subscribe(node.topic, node.share, subscribeCallback);
                    }
                    else {
                        recvClient.subscribe(node.topic, subscribeCallback);
                    }
                });
                recvClient.start();

                node.on("close", function (done) {
                    recvClient.stop(done);
                });
            }

        }
    }
    RED.nodes.registerType("mqlight in", MQLightIn);

    function MQLightOut(n) {
        RED.nodes.createNode(this, n);
        this.topic = n.topic || "";
        this.service = n.service;
        this.serviceConfig = RED.nodes.getNode(this.service);
        var node = this;

        if (node.serviceConfig) {
            if (node.serviceConfig.client) {
                var sendClient = node.serviceConfig.client;
                sendClient.on("error", function(err) {
                    if (err) { node.error(err.toString()); }
                });
                sendClient.on("started", function () {
                    node.on("input", function(msg) {
                        var topic = node.topic;
                        if (topic === "") {
                            if (msg.topic) {
                                topic = msg.topic;
                            }
                            else {
                                node.warn("No topic set in MQ Light out node");
                                return;
                            }
                        }
                        sendClient.send(topic, msg.payload, function(err) {
                            if (err) {
                                node.error(err,msg);
                            }
                        });
                    });
                });
                sendClient.start();

                node.on("close", function (done) {
                    sendClient.stop(done);
                });
            }
        }
    }
    RED.nodes.registerType("mqlight out", MQLightOut);
};
