
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
            var moon = SunCalc.getMoonIllumination(now);
            var moon2 = SunCalc.getMoonPosition(now, node.lat, node.lon);
            moon = Object.assign(moon, moon2);
            moon.altitude = moon.altitude * 180 / Math.PI;
            moon.azimuth = moon.azimuth * 180 / Math.PI;
            moon.parallacticAngle = moon.parallacticAngle * 180 /Math.PI;
            moon.icon = "new";
            if (moon.phase > 0.02) { moon.icon = "wax-cres"}
            if (moon.phase > 0.22) { moon.icon = "first-quart"}
            if (moon.phase > 0.28) { moon.icon = "wax-gibb"}
            if (moon.phase > 0.48) { moon.icon = "full"}
            if (moon.phase > 0.52) { moon.icon = "wan-gibb"}
            if (moon.phase > 0.72) { moon.icon = "third-quart"}
            if (moon.phase > 0.78) { moon.icon = "wan-cres"}
            if (moon.phase > 0.98) { moon.icon = "new"}
            moon.icon = "wi-moon-" + moon.icon;
            var sun = SunCalc.getPosition(now, node.lat, node.lon);
            sun.altitude = sun.altitude * 180 / Math.PI;
            sun.azimuth = sun.azimuth * 180 / Math.PI;
            var msg = {payload:0, topic:"sun", sun:sun, moon:moon, start:s1, end:s2, now:now};
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
