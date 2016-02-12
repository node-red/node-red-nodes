/**
 * Copyright 2013,2016 IBM Corp.
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
    var dns = require("dns")
    var ping = require ("net-ping");

    function PingNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.timer = n.timer * 1000;
        this.session = ping.createSession();
        var node = this;

        node.tout = setInterval(function() {
            dns.lookup(node.host, function(err, address, family) {
                if (typeof address === 'undefined') { address = node.host; }
                node.session.pingHost(address, function(error, target, sent, rcvd) {
                    var msg = { payload:false, topic:target };
                    if (error) {
                        msg.error = error.toString();
                    } else {
                        msg.payload = rcvd - sent;
                    }
                    node.send(msg);
                    node.session.close();
                });
            });
        }, node.timer);

        this.on("close", function() {
            if (node.tout) { clearInterval(this.tout); }
            if (node.session) { node.session.close(); }
        });
    }
    RED.nodes.registerType("ping",PingNode);
}
