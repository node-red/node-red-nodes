
module.exports = function(RED) {
    "use strict";
    var SunCalc = require('suncalc');

    function TimeswitchNode(n) {
        RED.nodes.createNode(this, n);
        this.lat = n.lat;
        this.lon = n.lon;
        this.start = n.start || "sunrise";
        this.end = n.end || "sunset";
        this.startt = n.starttime;
        this.endt = n.endtime;
        this.duskoff = n.duskoff;
        this.dawnoff = n.dawnoff;
        this.mytopic = n.mytopic;

        this.sun = n.sun;
        this.mon = n.mon;
        this.tue = n.tue;
        this.wed = n.wed;
        this.thu = n.thu;
        this.fri = n.fri;
        this.sat = n.sat;
        this.jan = n.jan;
        this.feb = n.feb;
        this.mar = n.mar;
        this.apr = n.apr;
        this.may = n.may;
        this.jun = n.jun;
        this.jul = n.jul;
        this.aug = n.aug;
        this.sep = n.sep;
        this.oct = n.oct;
        this.nov = n.nov;
        this.dec = n.dec;

        var node = this;
        var ison = 0;
        var newendtime = 0;

        this.on("input", function(msg2) {
            if (msg2.payload === "reset") { ison = 0; }

            var now = new Date();
            var nowoff = -now.getTimezoneOffset() * 60000;
            var nowMillis = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), 0);
            nowMillis += nowoff;
            var midnightMillis = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0);
            var today = Math.round((nowMillis - midnightMillis) / 60000) % 1440;
            var starttime = Number(node.startt);
            var endtime = Number(node.endt);

            if ((starttime >= 5000) || (endtime == 5000) || (endtime == 6000)) {
                var times = SunCalc.getTimes(now, node.lat, node.lon);
                var startMillis = Date.UTC(times[node.start].getUTCFullYear(), times[node.start].getUTCMonth(), times[node.start].getUTCDate(), times[node.start].getUTCHours(), times[node.start].getUTCMinutes());
                var endMillis = Date.UTC(times[node.end].getUTCFullYear(), times[node.end].getUTCMonth(), times[node.end].getUTCDate(), times[node.end].getUTCHours(), times[node.end].getUTCMinutes());
                startMillis += nowoff;
                endMillis += nowoff;
                var dawn = ((startMillis - midnightMillis) / 60000) + Number(node.dawnoff);
                var dusk = ((endMillis - midnightMillis) / 60000) + Number(node.duskoff);
                if (starttime == 5000) { starttime = dawn; }
                if (starttime == 6000) { starttime = dusk; }
                if (endtime == 5000) { endtime = dawn; }
                if (endtime == 6000) { endtime = dusk; }
                if (RED.settings.verbose) { node.log("Dawn " + parseInt(dawn / 60) + ":" + dawn % 60 + " - Dusk " + parseInt(dusk / 60) + ":" + dusk % 60); }
            }

            var proceed = 0;
            switch (now.getDay()) {
                case 0 : { if (node.sun) { proceed++; } break; }
                case 1 : { if (node.mon) { proceed++; } break; }
                case 2 : { if (node.tue) { proceed++; } break; }
                case 3 : { if (node.wed) { proceed++; } break; }
                case 4 : { if (node.thu) { proceed++; } break; }
                case 5 : { if (node.fri) { proceed++; } break; }
                case 6 : { if (node.sat) { proceed++; } break; }
            }

            if (proceed) {
                switch (now.getMonth()) {
                    case 0 : { if (node.jan) { proceed++; } break; }
                    case 1 : { if (node.feb) { proceed++; } break; }
                    case 2 : { if (node.mar) { proceed++; } break; }
                    case 3 : { if (node.apr) { proceed++; } break; }
                    case 4 : { if (node.may) { proceed++; } break; }
                    case 5 : { if (node.jun) { proceed++; } break; }
                    case 6 : { if (node.jul) { proceed++; } break; }
                    case 7 : { if (node.aug) { proceed++; } break; }
                    case 8 : { if (node.sep) { proceed++; } break; }
                    case 9 : { if (node.oct) { proceed++; } break; }
                    case 10: { if (node.nov) { proceed++; } break; }
                    case 11: { if (node.dec) { proceed++; } break; }
                }
            }

            if (proceed >= 2) { proceed = 1; }
            else { proceed = 0; }

            newendtime = endtime;
            if (endtime > 10000) { newendtime = starttime + (endtime - 10000); }

            if (proceed) { // have to handle midnight wrap
                if (starttime <= newendtime) {
                    if ((today >= starttime) && (today <= newendtime)) { proceed++; }
                }
                else {
                    if ((today >= starttime) || (today <= newendtime)) { proceed++; }
                }
            }

            if (proceed >= 2) {
                var duration = newendtime - today;
                if (today > newendtime) { duration += 1440; }
                //node.status({fill:"yellow",shape:"dot",text:"on for " + duration + " mins"});
                node.status({fill:"yellow", shape:"dot", text:"on until " + parseInt(newendtime / 60) + ":" + ("0" + newendtime % 60).substr(-2)});
            }
            //else { node.status({fill:"blue",shape:"dot",text:"off"}); }
            else { node.status({fill:"blue", shape:"dot", text:"off until " + parseInt(starttime / 60) + ":" + ("0" + starttime % 60).substr(-2)}); }

            var msg = {};
            if (node.mytopic) { msg.topic = node.mytopic; }
            msg.payload = (proceed >= 2) ? 1 : 0;
            node.send(msg);
        });

        var tock = setTimeout(function() {
            node.emit("input", {});
        }, 2000); // wait 2 secs before starting to let things settle down – e.g. UI connect

        var tick = setInterval(function() {
            node.emit("input", {});
        }, 60000); // trigger every 60 secs

        this.on("close", function() {
            if (tock) { clearTimeout(tock); }
            if (tick) { clearInterval(tick); }
        });
    }

    RED.httpAdmin.post("/timeswitch/:id", RED.auth.needsPermission("timeswitch.write"), function(req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                node.emit("input", {payload:"reset"});
                res.sendStatus(200);
            }
            catch (err) {
                res.sendStatus(500);
                node.error("Inject failed:" + err);
            }
        }
        else {
            res.sendStatus(404);
        }
    });

    RED.nodes.registerType("timeswitch", TimeswitchNode);
};
