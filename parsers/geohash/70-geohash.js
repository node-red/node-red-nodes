
module.exports = function(RED) {
    "use strict";
    var geohash = require('ngeohash');

    function GeohashNode(n) {
        RED.nodes.createNode(this,n);
        this.property = n.property||"payload";
        var node = this;

        var round = function(value, decimals) {
            return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
        }

        this.on("input", function(msg) {
            var value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                if (typeof value === "string") {
                    // try to decode it...
                    var regexp = new RegExp('^[a-z0-9]{1,9}$'); // can only contain a-z or 0-9 and length 1-9
                    if (regexp.test(value)) {
                        var po = geohash.decode(value);
                        value = { lat:round(po.latitude,5), lon:round(po.longitude,5) };
                        value.error = { lat:round(po.error.latitude,5), lon:round(po.error.longitude,5) };
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                    }
                    else if (value.indexOf(",") !== -1) {
                        // has a comma so assume it's lat,lon(,precision)
                        var bits = value.split(",");
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
                                value = geohash.encode(la, lo, li);
                                RED.util.setMessageProperty(msg,node.property,value);
                                node.send(msg);
                            }
                            else {
                                node.warn("Incorrect string format - should be lat,lon");
                            }
                        }
                        else { node.warn("Unexpected string format - should be lat,lon"); }
                    }
                    else { node.warn("Unexpected string format - should either be lat,lon or geohash"); }
                }
                else if (typeof value === "object") {
                    if (value.hasOwnProperty("geohash")) {
                        var pos = geohash.decode(value.geohash);
                        value.lat = round(pos.latitude,5);
                        value.lon = round(pos.longitude,5);
                        value.error = { lat:round(pos.error.latitude,5), lon:round(pos.error.longitude,5) };
                        RED.util.setMessageProperty(msg,node.property,value);
                        node.send(msg);
                    }
                    else {
                        var lat = value.lat || value.latitude;
                        var lon = value.lon || value.longitude;
                        var len = parseInt(value.precision || 9);
                        if (len < 1) { len = 1; }
                        if (len > 9) { len = 9; }
                        if (lat && lon) {
                            value.geohash = geohash.encode(lat, lon, len);
                            RED.util.setMessageProperty(msg,node.property,value);
                            node.send(msg);
                        }
                        else { node.warn("lat or lon missing from msg."+node.property); }
                    }
                }
                else { node.warn("This node only expects strings or objects."); }
            }
        });
    }
    RED.nodes.registerType("geohash",GeohashNode);
}
