/**
 * Copyright 2014 Nicholas Humfrey
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
    var osc = require('node-osc');

    // The Input Node
    function OSCin(n) {
        RED.nodes.createNode(this,n);
        this.addr = n.addr;
        this.port = n.port;
        var node = this;

        var server = new osc.Server(this.port, this.addr);
        server.on('message', function (message, remote) {
            var topic = message.shift();
            if (message.length == 0) {
                message = "";
            } else if (message.length == 1) {
                message = message[0];
            }
            var msg = { topic:topic, payload:message, ip:remote.address, port:remote.port };
            node.send(msg);
        });

        server.on('listening', function () {
            var address = server.address();
            node.log('OSC listener at ' + address.address + ":" + address.port);
        });

        node.on("close", function() {
            try {
                server.kill();
                node.log('OSC listener stopped');
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType("osc in", OSCin);


    // The Output Node
    function OSCout(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        node.addr = n.addr;
        node.port = n.port;
        node.path = n.path;

        if (node.addr == "") {
            node.warn("OSC: ip address not set");
        } else if (node.port == 0) {
            node.warn("OSC: port not set");
        } else if (isNaN(node.port) || (node.port < 1) || (node.port > 65535)) {
            node.warn("OSC: port number not valid");
        } else {
            node.client = new osc.Client(node.addr, node.port);
        }

        node.on("input", function(msg) {
            var path = node.path || msg.topic || ""
            if (path == "") {
                node.warn("OSC: path and topic not set");
            } else {
                if (msg.payload === null || msg.payload.length === 0) {
                    node.client.send(path);
                } else {
                    node.client.send(path, msg.payload);
                }
            }
        });
    }
    RED.nodes.registerType("osc out", OSCout);
}
