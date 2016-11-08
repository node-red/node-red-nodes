
module.exports = function(RED) {
    "use strict";
    var geohash = require('ngeohash');

    function GeohashNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        var round = function(value, decimals) {
            return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
        }

        this.on("input", function(msg) {
            if (msg.hasOwnProperty("location")) {
                if (msg.location.hasOwnProperty("geohash")) {
                    var pos = geohash.decode(msg.location.geohash);
                    msg.location.lat = round(pos.latitude,5);
                    msg.location.lon = round(pos.longitude,5);
                    msg.location.error = { lat:round(pos.error.latitude,5), lon:round(pos.error.longitude,5) };
                    node.send(msg);
                }
                else {
                    var lt = msg.location.lat;
                    var ln = msg.location.lon;
                    var le = parseInt(msg.location.precision || 9);
                    if (le < 1) { le = 1; }
                    if (le > 9) { le = 9; }
                    if (lt && ln) {
                        msg.location.geohash = geohash.encode(lt, ln, le);
                        node.send(msg);
                    } else {
                        node.warn("lat or lon missing from msg.location");
                    }
                }
            }
            else if (typeof msg.payload === "string") {
                // try to decode it...
                var regexp = new RegExp('^[a-z0-9]{1,9}$'); // can only contain a-z or 0-9 and length 1-9
                if (regexp.test(msg.payload)) {
                    var po = geohash.decode(msg.payload);
                    msg.payload = { lat:round(po.latitude,5), lon:round(po.longitude,5) };
                    msg.payload.error = { lat:round(po.error.latitude,5), lon:round(po.error.longitude,5) };
                    node.send(msg);
                }
                else if (msg.payload.indexOf(",") !== -1) {
                    // has a comma so assume it's lat,lon(,precision)
                    var bits = msg.payload.split(",");
                    if ((bits.length === 2) || (bits.length === 3)) {
                        var li = 9;
                        if (bits.length === 3) {
                            li = parseInt(bits[2]);
                            if (li < 1) { li = 1; }
                            if (li > 9) { li = 9; }
                        }
                        var la = Number(bits[0]);
                        if (la < -90) { la = -90; }
                        if (la > 90) { la = 90; }
                        var lo = Number(bits[1]);
                        if (lo < -180) { lo = ((lo-180)%360)+180; }
                        if (lo > 180) { lo = ((lo+180)%360)-180; }
                        if (!isNaN(la) && !isNaN(lo)) {
                            msg.payload = geohash.encode(la, lo, li);
                            node.send(msg);
                        } else {
                            node.warn("Incorrect string format - should be lat,lon");
                        }
                    }
                    else { node.warn("Unexpected string format - should be lat,lon"); }
                }
                else { node.warn("Unexpected string format - should either be lat,lon or geohash"); }
            }
            else if (typeof msg.payload === "object") {
                var lat = msg.payload.lat || msg.payload.latitude;
                var lon = msg.payload.lon || msg.payload.longitude;
                var len = parseInt(msg.payload.precision || 9);
                if (len < 1) { len = 1; }
                if (len > 9) { len = 9; }
                if (lat && lon) {
                    msg.payload.geohash = geohash.encode(lat, lon, len);
                    node.send(msg);
                } else {
                    node.warn("lat or lon missing from msg.payload");
                }
            }
            else {
                node.warn("This node only expects strings or objects.");
            }
        });
    }
    RED.nodes.registerType("geohash",GeohashNode);
}
