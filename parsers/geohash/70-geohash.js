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
    var geohash = require('ngeohash');

    function GeohashNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        var round = function(value, decimals) {
            return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
        }

        this.on("input", function(msg) {
            var pos, lat, lon, len;
            if (msg.hasOwnProperty("location")) {
                if (msg.location.hasOwnProperty("geohash")) {
                    pos = geohash.decode(msg.location.geohash);
                    msg.location.lat = round(pos.latitude,5);
                    msg.location.lon = round(pos.longitude,5);
                    msg.location.error = { lat:round(pos.error.latitude,5), lon:round(pos.error.longitude,5) };
                    node.send(msg);
                }
                else {
                    lat = msg.location.lat;
                    lon = msg.location.lon;
                    len = parseInt(msg.location.precision || msg.location.payload || 9);
                    if (len < 1) { len = 1; }
                    if (len > 9) { len = 9; }
                    if (lat && lon) {
                        msg.location.geohash = geohash.encode(lat, lon, len);
                        node.send(msg);
                    }
                }
            }
            else if (typeof msg.payload === "string") {
                // try to decode it...
                var regexp = new RegExp('^[a-z0-9]{1,9}$'); // can only contain a-z or 0-9 and length 1-9
                if (regexp.test(msg.payload)) {
                    pos = geohash.decode(msg.payload);
                    msg.payload = { lat:round(pos.latitude,5), lon:round(pos.longitude,5) };
                    msg.payload.error = { lat:round(pos.error.latitude,5), lon:round(pos.error.longitude,5) };
                    node.send(msg);
                }
                else if (msg.payload.indexOf(",") !== -1) {
                    // has a comma so assume it's lat,lon(,precision)
                    var bits = msg.payload.split(",");
                    if (bits.length === 2) {
                        var la = Number(bits[0]);
                        if (la < -90) { la = -90; }
                        if (la > 90) { la = 90; }
                        var lo = Number(bits[1]);
                        if (lo < -180) { lo = -180; }
                        if (lo > 180) { la = 180; }
                        msg.payload = geohash.encode(la, lo);
                        node.send(msg);
                    }
                    else { node.warn("Unexpected string format - should be lat,lon"); }
                }
                else { node.warn("Unexpected string format - should either be lat,lon or geohash"); }
            }
            else if (typeof msg.payload === "object") {
                lat = msg.payload.lat || msg.payload.latitude;
                lon = msg.payload.lon || msg.payload.longitude;
                len = parseInt(msg.payload.precision || 9);
                if (len < 1) { len = 1; }
                if (len > 9) { len = 9; }
                if (lat && lon) {
                    msg.payload.geohash = geohash.encode(lat, lon, len);
                    node.send(msg);
                }
            }
            else {
                node.warn("This node only expects strings or objects.");
            }
        });
    }
    RED.nodes.registerType("geohash",GeohashNode);
}
