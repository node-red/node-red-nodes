/**
 * Copyright 2013 IBM Corp.
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
    var wol = require('wake_on_lan');
    var chk = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;

    function WOLnode(n) {
        RED.nodes.createNode(this,n);
        this.mac = n.mac.trim();
        var node = this;

        this.on("input", function(msg) {
            var mac = this.mac || msg.mac || null;
            if (mac != null) {
                if (chk.test(mac)) {
                    try {
                        wol.wake(mac, function(error) {
                            if (error) { node.warn(error); }
                            else if (RED.settings.verbose) {
                                node.log("sent WOL magic packet");
                            }
                        });
                    } catch(e) {
                        if (RED.settings.verbose) { node.log("WOL: socket error"); }
                    }
                }
                else { node.warn('WOL: bad mac address "'+mac+'"'); }
            }
            else { node.warn("WOL: no mac address specified"); }
        });
    }
    RED.nodes.registerType("wake on lan",WOLnode);
}
