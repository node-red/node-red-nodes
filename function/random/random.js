/**
 * Copyright 2014, 2015 IBM Corp.
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
    function RandomNode(n) {
        RED.nodes.createNode(this,n);
        this.low = Number(n.low || 1);
        this.high = Number(n.high || 10);
        this.inte = n.inte || false;
        var node = this;
        this.on("input", function(msg) {
            if (node.inte == "true" || node.inte === true) {
                msg.payload = Math.round(Number(Math.random()) * (node.high - node.low + 1) + node.low - 0.5);
            } else {
                msg.payload = Number(Math.random()) * (node.high - node.low) + node.low;
            }
            node.send(msg);
        });
    }
    RED.nodes.registerType("random",RandomNode);
}
