
module.exports = function(RED) {
    "use strict";
    var SunCalc = require('suncalc');

    function SunNode(n) {
        RED.nodes.createNode(this,n);
        this.lat = n.lat;
        this.lon = n.lon;
        this.start = n.start;
        this.end = n.end;
        this.soff = (n.soff || 0) * 60000;  // minutes
        this.eoff = (n.eoff || 0) * 60000;  // minutes

        var node = this;
        var oldval = null;

        var tick = function() {
            var now = new Date();
            var times = SunCalc.getTimes(now, node.lat, node.lon);
            var nowMillis = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),now.getUTCHours(),now.getUTCMinutes());
            var startMillis = Date.UTC(times[node.start].getUTCFullYear(),times[node.start].getUTCMonth(),times[node.start].getUTCDate(),times[node.start].getUTCHours(),times[node.start].getUTCMinutes());
            var endMillis = Date.UTC(times[node.end].getUTCFullYear(),times[node.end].getUTCMonth(),times[node.end].getUTCDate(),times[node.end].getUTCHours(),times[node.end].getUTCMinutes());
            var e1 = nowMillis - startMillis - node.soff;
            var e2 = nowMillis - endMillis - node.eoff;
            var s1 = new Date(startMillis + node.soff);
            var s2 = new Date(endMillis + node.eoff);
            if (isNaN(e1)) { e1 = 1; }
            if (isNaN(e2)) { e2 = -1; }
            var moon = parseInt(SunCalc.getMoonIllumination(now).fraction * 100 + 0.5) / 100;
            var msg = {payload:0, topic:"sun", moon:moon, start:s1, end:s2, now:now};
            if ((e1 > 0) & (e2 < 0)) { msg.payload = 1; }
            if (oldval == null) { oldval = msg.payload; }
            if (msg.payload == 1) { node.status({fill:"yellow",shape:"dot",text:"day"}); }
            else { node.status({fill:"blue",shape:"dot",text:"night"}); }
            if (msg.payload != oldval) {
                oldval = msg.payload;
                node.send([msg,msg]);
            }
            else { node.send(msg); }
        }

        this.tick = setInterval(function() { tick(); }, 60000);
        this.tock = setTimeout(function() { tick(); }, 500);

        this.on("close", function() {
            if (this.tock) { clearTimeout(this.tock); }
            if (this.tick) { clearInterval(this.tick); }
        });
    }
    RED.nodes.registerType("sunrise",SunNode);
};
