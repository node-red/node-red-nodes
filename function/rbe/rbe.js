/**
 * Copyright 2014, 2016 IBM Corp.
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
        this.gap = n.gap || "0";
        this.start = n.start || '';
        this.inout = n.inout || "out";
        this.pc = false;
        if (this.gap.substr(-1) === "%") {
            this.pc = true;
            this.gap = parseFloat(this.gap);
        }
        this.g = this.gap;
        var node = this;

        node.previous = {};
        this.on("input",function(msg) {
            if (msg.hasOwnProperty("payload")) {
                var t = msg.topic || "_no_topic";
                if (this.func === "rbe") {
                    if (typeof(msg.payload) === "object") {
                        if (typeof(node.previous[t]) !== "object") { node.previous[t] = {}; }
                        if (!RED.util.compareObjects(msg.payload, node.previous[t])) {
                            node.previous[t] = msg.payload;
                            node.send(msg);
                        }
                    }
                    else {
                        if (msg.payload !== node.previous[t]) {
                            node.previous[t] = msg.payload;
                            node.send(msg);
                        }
                    }
                }
                else {
                    var n = parseFloat(msg.payload);
                    if (!isNaN(n)) {
                        if ((typeof node.previous[t] === 'undefined') && (this.func === "narrowband")) {
                            if (node.start === '') { node.previous[t] = n; }
                            else { node.previous[t] = node.start; }
                        }
                        if (node.pc) { node.gap = (node.previous[t] * node.g / 100) || 0; }
                        if (!node.previous.hasOwnProperty(t)) { node.previous[t] = n - node.gap; }
                        if (Math.abs(n - node.previous[t]) >= node.gap) {
                            if (this.func === "deadband") {
                                if (node.inout === "out") { node.previous[t] = n; }
                                node.send(msg);
                            }
                        }
                        else {
                            if (this.func === "narrowband") {
                                if (node.inout === "out") { node.previous[t] = n; }
                                node.send(msg);
                            }
                        }
                        if (node.inout === "in") { node.previous[t] = n; }
                    }
                    else {
                        node.warn(RED._("rbe.warn.nonumber"));
                    }
                }
            } // ignore msg with no payload property.
        });
    }
    RED.nodes.registerType("rbe",RbeNode);
}
