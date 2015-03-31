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

    function RbeNode(n) {
        RED.nodes.createNode(this,n);
        this.func = n.func || "rbe";
        this.gap = n.gap || 0;
        var node = this;

        var previous = null;
        this.on("input",function(msg) {
            if (msg.hasOwnProperty("payload")) {
                if (this.func === "rbe") {
                    if (msg.payload != previous) {
                        previous = msg.payload;
                        node.send(msg);
                    }
                }
                else {
                    var n = parseFloat(msg.payload);
                    if (!isNaN(n)) {
                        if (previous == null) { previous = n - node.gap; }
                        if (Math.abs(n - previous) >= node.gap) {
                            previous = n;
                            node.send(msg);
                        }
                    }
                    else {
                        node.warn("no number found in payload");
                    }
                }
            } // ignore msg with no payload property.
        });
    }
    RED.nodes.registerType("rbe",RbeNode);
}
