
module.exports = function(RED) {
    "use strict";

    function SmoothNode(n) {
        RED.nodes.createNode(this, n);
        this.action = n.action;
        this.round = n.round || false;
        if (this.round == "true") { this.round = 0; }
        this.count = Number(n.count);
        var node = this;
        var a = [];
        var tot = 0;
        var tot2 = 0;
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
                        if (node.action === "sd") {
                            tot = tot + n - pop;
                            tot2 = tot2 + (n*n) - (pop * pop);
                            if (a.length > 1) {
                               msg.payload = Math.sqrt((a.length * tot2 - tot * tot)/(a.length * (a.length - 1)));
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
