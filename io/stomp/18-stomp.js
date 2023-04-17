
module.exports = function(RED) {
    "use strict";
    var StompClient = require('stomp-client');

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
    // ------------------- Nodes --------------------
    // ----------------------------------------------
    function StompServerNode(n) {
        RED.nodes.createNode(this,n);
        const node = this;
        // To keep track of processing nodes that use this config node for their connection
        node.users = {};
        // Config node state
        node.connected = false;
        node.connecting = false;
        /** Flag to avoid race conditions between `deregister` and the `close` event of the config node (ex. on redeploy) */
        node.closing = false;
        /** Options to pass to the stomp-client API */
        node.options = {};
        node.sessionId = null;
        node.subscribtionIndex = 1;
        node.subscriptionIds = {};
        /** @type { StompClient } */
        node.client;
        node.setOptions = function(options, init) {
            if (!options || typeof options !== "object") {
                return; // Nothing to change
            }

            // Apply property changes (only if the property exists in the options object)
            setIfHasProperty(options, node, "server", init);
            setIfHasProperty(options, node, "port", init);
            setIfHasProperty(options, node, "protocolVersion", init);
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
                address: node.server,
                port: node.port * 1,
                user: node.username,
                pass: node.password,
                protocolVersion: node.protocolVersion,
                reconnectOpts: {
                    retries: node.reconnectRetries * 1,
                    delay: node.reconnectDelay * 1
                },
                vhost: node.vhost
            };
        }

        node.setOptions(n, true);

        /**
         * Register a STOMP processing node to the connection.
         * @param { StompInNode | StompOutNode | StompAckNode } stompNode The STOMP processing node to register
         * @param { Function } callback
         */
        node.register = function(stompNode, callback = () => {}) {
            node.users[stompNode.id] = stompNode;
            // Auto connect when first STOMP processing node is added
            if (Object.keys(node.users).length === 1) {
                node.connect(callback);
            } else {
                callback();
            }
        }

        /**
         * Remove registered STOMP processing nodes from the connection.
         * @param { StompInNode | StompOutNode | StompAckNode } stompNode The STOMP processing node to unregister
         * @param { Boolean } autoDisconnect Automatically disconnect from the STOM server when no processing nodes registered to the connection
         * @param { Function } callback 
         */
        node.deregister = function(stompNode, autoDisconnect, callback = () => {}) {
            delete node.users[stompNode.id];
            if (autoDisconnect && !node.closing && node.connected && Object.keys(node.users).length === 0) {
                node.disconnect(callback);
            } else {
                callback();
            }
        }

        /**
         * Wether a new connection can be made.
         * @returns `true` or `false`
         */
        node.canConnect = function() {
            return !node.connected && !node.connecting;
        }

        /**
         * Connect to the STOMP server.
         * @param {Function} callback 
         */
        node.connect = function(callback = () => {}) {
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
                    
                    node.client.on("connect", function() {
                        node.closing = false;
                        node.connecting = false;
                        node.connected = true;
                        callback();

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

                    node.client.connect(function(sessionId) {
                        node.sessionId = sessionId;
                    });

                } catch (err) {
                    node.error(err);
                }
            } else {
                node.log("Not connecting to STOMP server, already connected");
                callback();
            }
        }

        /**
         * Disconnect from the STOMP server.
         * @param {Function} callback 
         */
        node.disconnect = function(callback = () => {}) {
            const waitDisconnect = (client, timeout) => {
                return new Promise((resolve, reject) => {
                    // Set flag to avoid race conditions for disconnect as every node tries to call it directly or indirectly using deregister
                    node.closing = true;
                    const t = setTimeout(() => {
                        reject();
                    }, timeout);
                    client.disconnect(() => {
                        clearTimeout(t);
                        resolve();
                    });
                });
            }

            if (!node.client) {
                node.warn("Can't disconnect, connection not initialized.");
                callback();
            } else if (node.closing || !node.connected) {
                // Disconnection already in progress or not connected
                callback();
            } else {
                node.log('Disconnecting from STOMP server...');
                waitDisconnect(node.client, 2000).then(() => {
                    node.log("Disconnected from STOMP server", {sessionId: node.sessionId, url: `${node.options.address}:${node.options.port}`, protocolVersion: node.options.protocolVersion})
                }).catch(() => {
                    node.log("Disconnect timeout closing node...");
                }).finally(() => {
                    node.sessionId = null;
                    node.subscribtionIndex = 1;
                    node.subscriptionIds = {};
                    node.connected = false;
                    node.connecting = false;
                    setStatusDisconnected(node, true);
                    callback();
                });
            }
        }

        /**
         * Subscribe to a given STOMP queue.
         * @param { String}  queue The queue to subscribe to
         * @param { "auto" | "client" | "client-individual" } clientAck Can be `auto`, `client` or `client-individual` (the latter only starting from STOMP v1.1)
         * @param { Function } callback 
         */
        node.subscribe = function(queue, acknowledgement, callback) {
            node.log(`Subscribing to: ${queue}`);

            if (node.connected) {
                if (!node.subscriptionIds[queue]) {
                    node.subscriptionIds[queue] = node.subscribtionIndex++;
                }

                const headers = {
                    id: node.subscriptionIds[queue],
                    // Only set client-individual if not v1.0
                    ack: acknowledgement === "client-individual" && node.options.protocolVersion === "1.0" ? "client" : acknowledgement 
                }

                node.client.subscribe(queue, headers, function(body, responseHeaders) {
                    let msg = { headers: responseHeaders, topic: queue };
                    try {
                        msg.payload = JSON.parse(body);
                    } catch {
                        msg.payload = body;
                    }
                    callback(msg);
                });
            } else {
                node.error("Can't subscribe, not connected");
            }
        }

        /**
         * Unsubscribe from a STOMP queue.
         * @param {String} queue The STOMP queue to unsubscribe from
         * @param {Object} headers Headers to add to the unsubscribe message
         */
        node.unsubscribe = function(queue, headers = {}) {
            delete node.subscriptionIds[queue];
            if (node.connected) {
                node.client.unsubscribe(queue, headers);
                node.log(`Unsubscribed from ${queue}`, headers);
            }
        }

        /**
         * Publish a STOMP message on a queue.
         * @param {String} queue The STOMP queue to publish to
         * @param {any} message The message to send
         * @param {Object} headers STOMP headers to add to the SEND command
         */
        node.publish = function(queue, message, headers = {}) {
            if (node.connected) {
                node.client.publish(queue, message, headers);
            } else {
                node.error("Can't publish, not connected");
            }
        }

        node.ack = function(queue, messageId, transaction = undefined) {
            if (node.connected) {
                node.client.ack(messageId, subscriptionIds[queue], transaction);
            } else {
                node.error("Can't publish, not connected");
            }
        }

        node.on("close", function(done) {
            node.disconnect(function() { done (); });
        });
    }
    RED.nodes.registerType("stomp-server", StompServerNode, {
        credentials: {
            user: { type: "text" },
            password: { type: "password" }
        }
    });

    function StompInNode(n) {
        RED.nodes.createNode(this,n);
        /** @type { StompInNode } */
        const node = this;
        node.server = n.server;
        /** @type { StompServerNode } */
        node.serverConnection = RED.nodes.getNode(node.server);
        node.topic = n.topic;
        node.ack = n.ack;

        if (node.serverConnection) {
            setStatusDisconnected(node);

            if (node.topic) {
                node.serverConnection.register(node, function() {
                    node.serverConnection.subscribe(node.topic, node.ack, function(msg) {
                        node.send(msg);
                    });
                });

                if (node.serverConnection.connected) {
                    setStatusConnected(node);
                }
            }
        } else {
            node.error("Missing server config");
        }

        node.on("close", function(removed, done) {
            if (node.serverConnection) {
                if (node.serverConnection.connected) {
                    node.serverConnection.unsubscribe(node.topic);
                }
                node.serverConnection.deregister(node, true, done);
                node.serverConnection = null;
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType("stomp in",StompInNode);


    function StompOutNode(n) {
        RED.nodes.createNode(this,n);
        /** @type { StompOutNode } */
        const node = this;
        node.server = n.server;
        /** @type { StompServerNode } */
        node.serverConnection = RED.nodes.getNode(node.server);
        node.topic = n.topic;

        if (node.serverConnection) {
            setStatusDisconnected(node);

            node.on("input", function(msg, send, done) {
                if (node.topic && msg.payload) {
                    try {
                        msg.payload = JSON.stringify(msg.payload);
                    } catch {
                        msg.payload = `${msg.payload}`;
                    }
                    node.serverConnection.publish(node.topic, msg.payload, msg.headers || {});
                    done();
                }
            });

            node.serverConnection.register(node);
            if (node.serverConnection.connected) {
                setStatusConnected(node);
            }
        } else {
            node.error("Missing server config");
        }

        node.on("close", function(removed, done) {
            if (node.serverConnection) {
                node.serverConnection.deregister(node, true, done);
                node.serverConnection = null;
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType("stomp out",StompOutNode);

    function StompAckNode(n) {
        RED.nodes.createNode(this,n);
        /** @type { StompOutNode } */
        const node = this;
        node.server = n.server;
        /** @type { StompServerNode } */
        node.serverConnection = RED.nodes.getNode(node.server);
        node.topic = n.topic;

        if (node.serverConnection) {
            setStatusDisconnected(node);

            node.on("input", function(msg, send, done) {
                node.serverConnection.ack(msg.messageId, node.topic, msg.transaction);
                done();
            });

            node.serverConnection.register(node);
            if (node.serverConnection.connected) {
                setStatusConnected(node);
            }
        } else {
            node.error("Missing server config");
        }

        node.on("close", function(removed, done) {
            if (node.serverConnection) {
                node.serverConnection.deregister(node, true, done);
                node.serverConnection = null;
            } else {
                done();
            }
        });
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