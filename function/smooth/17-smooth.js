
module.exports = function(RED) {
    "use strict";

    function SmoothNode(n) {
        RED.nodes.createNode(this, n);
        this.action = n.action;
        this.round = n.round || false;
        if (this.round == "true") { this.round = 0; }
        this.count = Number(n.count);
        this.mult = n.mult || "single";
        this.reduce = n.reduce || false;
        this.property = n.property || "payload";
        var node = this;
        var v = {};

        this.on('input', function (msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            var top = msg.topic || "_my_default_topic";
            var reduce = node.reduce;
            if (this.mult === "single") { top = "a"; }

            if ((v.hasOwnProperty(top) !== true) || msg.hasOwnProperty("reset")) {
                v[top] = {};
                v[top].a = [];
                v[top].tot = 0;
                v[top].tot2 = 0;
                v[top].pop = 0;
                v[top].old = null;
                v[top].count = this.count;
                v[top].iter = 0;
            }
            if (value !== undefined) {
                var n = Number(value);
                if (!isNaN(n)) {
                    v[top].iter++;
                    if ((node.action === "low") || (node.action === "high")) {
                        if (v[top].old == null) { v[top].old = n; }
                        v[top].old = v[top].old + (n - v[top].old) / v[top].count;
                        if (node.action === "low") { value = v[top].old; }
                        else { value = n - v[top].old; }
                        reduce = false;
                    }
                    else {
                        v[top].a.push(n);
                        if (v[top].a.length > v[top].count) { v[top].pop = v[top].a.shift(); }
                        if (node.action === "max") {
                            value = Math.max.apply(Math, v[top].a);
                        }
                        if (node.action === "min") {
                            value = Math.min.apply(Math, v[top].a);
                        }
                        if (node.action === "mean") {
                            v[top].tot = v[top].tot + n - v[top].pop;
                            value = v[top].tot / v[top].a.length;
                        }
                        if (node.action === "sd") {
                            v[top].tot = v[top].tot + n - v[top].pop;
                            v[top].tot2 = v[top].tot2 + (n*n) - (v[top].pop * v[top].pop);
                            if (v[top].a.length > 1) {
                                value = Math.sqrt((v[top].a.length * v[top].tot2 - v[top].tot * v[top].tot)/(v[top].a.length * (v[top].a.length - 1)));
                            }
                            else { value = 0; }
                        }
                    }
                    if (node.round !== false) {
                        value = Math.round(value * Math.pow(10, node.round)) / Math.pow(10, node.round);
                    }
                    if (reduce == false || v[top].iter == v[top].count) {
                        v[top].iter = 0;
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                    }
                }
                else { node.log("Not a number: " + value); }
            } // ignore msg with no payload property.
        });
    }
    RED.nodes.registerType("smooth", SmoothNode);
}
