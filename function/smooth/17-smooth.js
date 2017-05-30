
module.exports = function(RED) {
    "use strict";

    function SmoothNode(n) {
        RED.nodes.createNode(this, n);
        this.action = n.action;
        this.round = n.round || false;
        if (this.round == "true") { this.round = 0; }
        this.count = Number(n.count);
        this.mult = n.mult || "single";
        var node = this;
        var v = {};

        this.on('input', function (msg) {
            var top = msg.topic || "_my_default_topic";
            if (this.mult === "single") { top = "a"; }

            if ((v.hasOwnProperty(top) !== true) || msg.hasOwnProperty("reset")) {
                v[top] = {};
                v[top].a = [];
                v[top].tot = 0;
                v[top].tot2 = 0;
                v[top].pop = 0;
                v[top].old = null;
                v[top].count = this.count;
            }
            if (msg.hasOwnProperty("payload")) {
                var n = Number(msg.payload);
                if (!isNaN(n)) {
                    if ((node.action === "low") || (node.action === "high")) {
                        if (v[top].old == null) { v[top].old = n; }
                        v[top].old = v[top].old + (n - v[top].old) / v[top].count;
                        if (node.action === "low") { msg.payload = v[top].old; }
                        else { msg.payload = n - v[top].old; }
                    }
                    else {
                        v[top].a.push(n);
                        if (v[top].a.length > v[top].count) { v[top].pop = v[top].a.shift(); }
                        if (node.action === "max") {
                            msg.payload = Math.max.apply(Math, v[top].a);
                        }
                        if (node.action === "min") {
                            msg.payload = Math.min.apply(Math, v[top].a);
                        }
                        if (node.action === "mean") {
                            v[top].tot = v[top].tot + n - v[top].pop;
                            msg.payload = v[top].tot / v[top].a.length;
                        }
                        if (node.action === "sd") {
                            v[top].tot = v[top].tot + n - v[top].pop;
                            v[top].tot2 = v[top].tot2 + (n*n) - (v[top].pop * v[top].pop);
                            if (v[top].a.length > 1) {
                                msg.payload = Math.sqrt((v[top].a.length * v[top].tot2 - v[top].tot * v[top].tot)/(v[top].a.length * (v[top].a.length - 1)));
                            }
                            else { msg.payload = 0; }
                        }
                    }
                    if (node.round !== false) {
                        msg.payload = Math.round(msg.payload * Math.pow(10, node.round)) / Math.pow(10, node.round);
                    }
                    node.send(msg);
                }
                else { node.log("Not a number: "+msg.payload); }
            } // ignore msg with no payload property.
        });
    }
    RED.nodes.registerType("smooth", SmoothNode);
}
