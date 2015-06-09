/**
 * Copyright 2013, 2015 IBM Corp.
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
            } else {
                util.log('[mqlight] ['+id+'] connected to service '+n.service);
            }
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
                    recvClient.on("error", function(err) {
                        if (err) {
                            node.error(err.toString());
                        }
                    });
                    var subscribeCallback = function(err) {
                        if (err) {
                            node.error("Failed to subscribe: " + err);
                        } else {
                            node.log("Subscribed to "+node.topic+(node.share?" ["+node.share+"]":""));
                        }
                    };

                    if (node.share) {
                        recvClient.subscribe(node.topic, node.share, subscribeCallback);
                    } else {
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

                sendClient.on("started", function () {
                    node.on("input", function(msg) {
                        var topic = node.topic;
                        if (topic === "") {
                            if (msg.topic) {
                                node.topic = msg.topic;
                            } else {
                                node.warn("No topic set in MQ Light out node");
                                return;
                            }
                        }
                        sendClient.send(node.topic, msg.payload, function(err) {
                            if (err) {
                                node.error(err,msg);
                            }
                        });
                    });
                });
                sendClient.on("error", function(err) {
                    if (err) {
                        node.error(err.toString());
                    }
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
