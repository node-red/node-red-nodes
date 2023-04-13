
module.exports = function(RED) {
    "use strict";
    var StompClient = require('stomp-client');
    var querystring = require('querystring');

    // ----------------------------------------------
    // ------------------- State --------------------
    // ----------------------------------------------
    function updateStatus(node, allNodes) {
        let setStatus = setStatusDisconnected;

        if (node.connecting) {
            setStatus = setStatusConnecting;
        } else if (node.connected) {
            setStatus = setStatusConnected;
        }

        setStatus(node, allNodes);
    }

    function setStatusDisconnected(node, allNodes) {
        if (allNodes) {
            for (let id in node.users) {
                if (hasProperty(node.users, id)) {
                    node.users[id].status({ fill: "red", shape: "ring", text: "node-red:common.status.disconnected"});
                }
            }
        } else {
            node.status({ fill: "red", shape: "ring", text: "node-red:common.status.disconnected" })
        }
    }

    function setStatusConnecting(node, allNodes) {
        if(allNodes) {
            for (var id in node.users) {
                if (hasProperty(node.users, id)) {
                    node.users[id].status({ fill: "yellow", shape: "ring", text: "node-red:common.status.connecting" });
                }
            }
        } else {
            node.status({ fill: "yellow", shape: "ring", text: "node-red:common.status.connecting" });
        }
    }

    function setStatusConnected(node, allNodes) {
        if(allNodes) {
            for (var id in node.users) {
                if (hasProperty(node.users, id)) {
                    node.users[id].status({ fill: "green", shape: "dot", text: "node-red:common.status.connected" });
                }
            }
        } else {
            node.status({ fill: "green", shape: "dot", text: "node-red:common.status.connected" });
        }
    }

    function setStatusError(node, allNodes) {
        if(allNodes) {
            for (var id in node.users) {
                if (hasProperty(node.users, id)) {
                    node.users[id].status({ fill: "red", shape: "dot", text: "error" });
                }
            }
        } else {
            node.status({ fill: "red", shape: "dot", text: "error" });
        }
    }

    // ----------------------------------------------
    // ---------------- Connection ------------------
    // ----------------------------------------------
    function handleConnectAction(node, msg, done) {
        const clientOptions = typeof msg.clientOptions === 'object' ? msg.clientOptions : null;
        if (clientOptions) {
            if (!node.client) {
                // Client has not been initialized - initialize client and connect
                node.client = new StompClient(clientOptions);
                node.client.connect(function(sessionId) {
                    done(sessionId);
                });
            } else {
                // Already connected/connecting/reconnecting
                if (clientOptions.forceReconnect) {
                    // The force flag tells us to cycle the connection
                    node.client.disconnect(function() {
                        node.client = new StompClient(clientOptions);
                        node.client.connect(function(sessionId) {
                            done(sessionId)
                        })
                    });
                }
            }
        } else {
            done(new Error("No connection options provided"));
        }
    }

    function handleDisconnectAction(node, done) {
        node.client.disconnect(function() {
            done();
        });
    }

    function StompServerNode(n) {
        RED.nodes.createNode(this,n);
        const node = this;
        // To keep track of processing nodes that use this config node for their connection
        node.users = {};
        // Config node state
        node.connected = false;
        node.connecting = false;
        node.closing = false;
        node.options = {};
        // node.subscriptions = {};
        node.sessionId = null;
        /** @type {StompClient} */
        node.client;
        node.setOptions = function(options, init) {
            if (!options || typeof options !== "object") {
                return; // Nothing to change
            }

            // Apply property changes (only if the property exists in the options object)
            setIfHasProperty(options, node, "address", init);
            setIfHasProperty(options, node, "port", init);
            setIfHasProperty(options, node, "protocolVersion", init);
            setIfHasProperty(options, node, "clientAcknowledgement", init);
            setIfHasProperty(options, node, "vhost", init);
            setIfHasProperty(options, node, "reconnectRetries", init);
            setIfHasProperty(options, node, "reconnectDelay", init);

            if (node.credentials) {
                node.username = node.credentials.username;
                node.password = node.credentials.password;
            }
            if (!init && hasProperty(options, "username")) {
                node.username = options.username;
            }
            if (!init && hasProperty(options, "password")) {
                node.password = options.password;
            }

            // Build options for passing to the stomp-client API
            node.options = {
                address: node.address,
                port: node.port * 1,
                user: node.username,
                pass: node.password,
                protocolVersion: node.protocolVersion,
                reconnectOpts: {
                    retries: node.reconnectRetries * 1,
                    delay: node.reconnectDelay * 1
                }
            };
        }

        node.setOptions(n, true);

        // Define functions called by STOMP processing nodes
        node.register = function(stompNode) {
            node.users[stompNode.id] = stompNode;
            // Auto connect when first STOMP processing node is added
            if (Object.keys(node.users).length === 1) {
                node.connect();
                // Update nodes status
                setTimeout(function() { updateStatus(node, true) }, 1);
            }
        }

        node.deregister = function(stompNode, done, autoDisconnect) {
            delete node.users[stompNode.id];
            if (autoDisconnect && !node.closing && node.connected && Object.keys(node.users).length === 0) {
                node.disconnect(done);
            } else {
                done();
            }
        }

        node.canConnect = function() {
            return !node.connected && !node.connecting;
        }

        node.connect = function(callback) {
            if (node.canConnect()) {
                node.closing = false;
                node.connecting = true;
                setStatusConnecting(node, true);

                try {
                    // Remove left over client if needed
                    if (node.client) {
                        node.client.disconnect();
                        node.client = null;
                    }

                    node.client = new StompClient(node.options);
                    node.client.connect(function(sessionId) {
                        node.sessionId = sessionId;
                    });
                    
                    node.client.on("connect", function() {
                        node.closing = false;
                        node.connecting = false;
                        node.connected = true;
                        if (typeof callback === "function") {
                            callback();
                        }

                        node.log("Connected to STOMP server", {sessionId: node.sessionId, url: `${node.options.address}:${node.options.port}`, protocolVersion: node.options.protocolVersion});
                        setStatusConnected(node, true);
                    });
                    
                    node.client.on("reconnect", function(sessionId, numOfRetries) {
                        node.connecting = false;
                        node.connected = true;
                        node.sessionId = sessionId;

                        node.log("Reconnected to STOMP server", {sessionId: node.sessionId, url: `${node.options.address}:${node.options.port}`, protocolVersion: node.options.protocolVersion, retries: numOfRetries});
                        setStatusConnected(node, true);
                    });

                    node.client.on("reconnecting", function() {
                        node.warn("reconnecting");
                        node.connecting = true;
                        node.connected = false;

                        node.log("Reconnecting to STOMP server...", {url: `${node.options.address}:${node.options.port}`, protocolVersion: node.options.protocolVersion});
                        setStatusConnecting(node, true);
                    });

                    node.client.on("error", function(err) {
                        node.error(err);
                        setStatusError(node, true);
                    });

                } catch (err) {
                    node.error(err);
                }
            }
        }

        node.disconnect = function(callback) {
            
        }
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
        const subscribe = () => {
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

        if (!node.serverConfig.connected) {
            node.status({fill:"grey",shape:"ring",text:"connecting"});
            node.client.connect(function(sessionId) {
                node.serverConfig.connected = true;
                subscribe();
            }, function(error) {
                node.serverConfig.connected = false;
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
        if(!node.serverConfig.connected) {
            node.status({fill:"grey",shape:"ring",text:"connecting"});
            node.client.connect(function(sessionId) {
                node.serverConfig.connected = true;
            }, function(error) {
                node.serverConfig.connected = false;
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
            if(!node.serverConfig.connected) {
                node.status({fill:"grey",shape:"ring",text:"connecting"});
                node.client.connect(function(sessionId) {
                    node.serverConfig.connected = true;
                }, function(error) {
                    node.serverConfig.connected = false;
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


// ----------------------------------------------
// ----------------- Helpers --------------------
// ----------------------------------------------
    /**
     * Helper function for applying changes to an objects properties ONLY when the src object actually has the property.
     * This avoids setting a `dst` property null/undefined when the `src` object doesnt have the named property.
     * @param {object} src Source object containing properties
     * @param {object} dst Destination object to set property
     * @param {string} propName The property name to set in the Destination object
     * @param {boolean} force force the dst property to be updated/created even if src property is empty
     */
    function setIfHasProperty(src, dst, propName, force) {
        if (src && dst && propName) {
            const ok = force || hasProperty(src, propName);
            if (ok) {
                dst[propName] = src[propName];
            }
        }
    }

    /**
     * Helper function to test an object has a property
     * @param {object} obj Object to test
     * @param {string} propName Name of property to find
     * @returns true if object has property `propName`
     */
    function hasProperty(obj, propName) {
        //JavaScript does not protect the property name hasOwnProperty
        //Object.prototype.hasOwnProperty.call is the recommended/safer test
        return Object.prototype.hasOwnProperty.call(obj, propName);
    }