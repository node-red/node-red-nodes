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
    var msgpack = require('msgpack-js');

    function MsgPackNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.on("input", function(msg) {
            if (Buffer.isBuffer(msg.payload)) {
                var l = msg.payload.length;
                msg.payload = msgpack.decode(msg.payload);
                if (typeof msg.payload === "object") {
                    node.send(msg);
                    node.status({text:l +" b->o "+ JSON.stringify(msg.payload).length});
                }
                else {
                    node.warn("Input not a MsgPack buffer");
                    node.status({text:"not a msgpack buffer"});
                }
            }
            else if (typeof msg.payload === "object") {
                var l = JSON.stringify(msg.payload).length;
                msg.payload = msgpack.encode(msg.payload);
                node.send(msg);
                node.status({text:l +" o->b "+ msg.payload.length});
            }
            else {
                node.warn("This node only handles js objects or msgpack buffers.");
                node.status({text:"error"});
            }
        });
    }
    RED.nodes.registerType("msgpack",MsgPackNode);
}
