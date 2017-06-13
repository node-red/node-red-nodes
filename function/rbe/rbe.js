
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
                if ((this.func === "rbe") || (this.func === "rbei")) {
                    var doSend = (this.func !== "rbei") || (node.previous.hasOwnProperty(t)) || false;
                    if (typeof(msg.payload) === "object") {
                        if (typeof(node.previous[t]) !== "object") { node.previous[t] = {}; }
                        if (!RED.util.compareObjects(msg.payload, node.previous[t])) {
                            node.previous[t] = msg.payload;
                            if (doSend) { node.send(msg); }
                        }
                    }
                    else {
                        if (msg.payload !== node.previous[t]) {
                            node.previous[t] = msg.payload;
                            if (doSend) { node.send(msg); }
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
                        else { node.gap = Number(node.gap); }
                        if ((node.previous[t] === undefined) && (node.func === "narrowbandEq")) { node.previous[t] = n; }
                        if (node.previous[t] === undefined) { node.previous[t] = n - node.gap; }
                        if (Math.abs(n - node.previous[t]) === node.gap) {
                            if (this.func === "deadbandEq") {
                                if (node.inout === "out") { node.previous[t] = n; }
                                node.send(msg);
                            }
                        }
                        else if (Math.abs(n - node.previous[t]) > node.gap) {
                            if (this.func === "deadband" || this.func === "deadbandEq") {
                                if (node.inout === "out") { node.previous[t] = n; }
                                node.send(msg);
                            }
                        }
                        else if (Math.abs(n - node.previous[t]) < node.gap) {
                            if ((this.func === "narrowband")||(this.func === "narrowbandEq")) {
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
