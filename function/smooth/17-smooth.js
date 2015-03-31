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

    function SmoothNode(n) {
        RED.nodes.createNode(this, n);
        this.action = n.action;
        this.round = n.round || false;
        this.count = Number(n.count);
        var node = this;
        var a = [];
        var tot = 0;
        var pop = 0;
        var old = null;

        this.on('input', function (msg) {
            if (msg.hasOwnProperty("payload")) {
                var n = Number(msg.payload);
                if (!isNaN(n)) {
                    if ((node.action === "low") || (node.action === "high")) {
                        if (old == null) { old = n; }
                        old = old + (n - old) / node.count;
                        if (node.action === "low") { msg.payload = old; }
                        else { msg.payload = n - old; }
                    }
                    else {
                        a.push(n);
                        if (a.length > node.count) { pop = a.shift(); }
                        if (node.action === "max") {
                            msg.payload = Math.max.apply(Math, a);
                        }
                        if (node.action === "min") {
                            msg.payload = Math.min.apply(Math, a);
                        }
                        if (node.action === "mean") {
                            tot = tot + n - pop;
                            msg.payload = tot / a.length;
                        }
                    }
                    if (node.round) { msg.payload = Math.round(msg.payload); }
                    node.send(msg);
                }
                else { node.log("Not a number: "+msg.payload); }
            } // ignore msg with no payload property.
        });
    }
    RED.nodes.registerType("smooth", SmoothNode);
}
