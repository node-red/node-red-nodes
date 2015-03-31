/**
 * Copyright 2014 IBM Corp.
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

    function Base64Node(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload")) {
                if (Buffer.isBuffer(msg.payload)) {
                    // Take binary buffer and make into a base64 string
                    msg.payload = msg.payload.toString('base64');
                    node.send(msg);
                }
                else if (typeof msg.payload === "string") {
                    // Take base64 string and make into binary buffer
                    var regexp = new RegExp('^[A-Za-z0-9+\/=]*$');
                    if ( regexp.test(msg.payload) && (msg.payload.length % 4 === 0) ) {
                        msg.payload = new Buffer(msg.payload,'base64');
                        node.send(msg);
                    }
                    else {
                        node.log("Not a Base64 string - maybe we should encode it...");
                        msg.payload = (new Buffer(msg.payload,"binary")).toString('base64');
                        node.send(msg);
                    }
                }
                else {
                    node.warn("This node only handles strings or buffers.");
                }
            } else { node.warn("No payload found to process"); }
        });
    }
    RED.nodes.registerType("base64",Base64Node);
}
