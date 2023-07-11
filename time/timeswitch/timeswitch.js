module.exports = function (RED) {
    "use strict";
    var SunCalc = require('suncalc');
    const spacetime = require("spacetime")
    const SUNRISE_KEY = "sunrise";
    const SUNSET_KEY = "sunset";

    function TimeswitchNode(n) {
        RED.nodes.createNode(this, n);
        this.lat = n.lat;
        this.lon = n.lon;
        this.startt = n.starttime;
        this.endt = n.endtime;
        this.sunriseOffset = n.dawnoff;
        this.sunsetOffset = n.duskoff;
        this.mytopic = n.mytopic;
        this.timezone = n.timezone || "UTC";

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

        this.on("input", function () {
            // current global time
            const now = spacetime.now();
            const nowNative = now.toNativeDate();

            // all sun events for the given lat/long
            const sunEvents = SunCalc.getTimes(nowNative, node.lat, node.lon);
            const sunAlt = SunCalc.getPosition(nowNative, node.lat, node.lon).altitude;
            var sunriseDateTime = spacetime(sunEvents[SUNRISE_KEY]).nearest("minute");
            var sunsetDateTime = spacetime(sunEvents[SUNSET_KEY]).nearest("minute");

            if (sunEvents[SUNRISE_KEY] == "Invalid Date") {
                if (sunAlt >= 0) { sunriseDateTime = now.startOf("day"); }
                else { sunriseDateTime = now.endOf("day"); }
            }

            if (sunEvents[SUNSET_KEY] == "Invalid Date") {
                if (sunAlt >= 0) { sunsetDateTime = now.endOf("day"); }
                else { sunsetDateTime = now.startOf("day"); }
            }

            // add optional sun event offset, if specified
            sunriseDateTime = sunriseDateTime.add(Number(node.sunriseOffset), "minutes");
            sunsetDateTime = sunsetDateTime.add(Number(node.sunsetOffset), "minutes");

            // check if sun event has already occurred today
            if (now.isAfter(sunriseDateTime)) {
                // get tomorrow's sunrise, since it'll be different
                // sunriseDateTime = spacetime(SunCalc.getTimes(now.add(1, "day").toNativeDate(), node.lat, node.lon)[SUNRISE_KEY]).nearest("minute");
                sunriseDateTime = sunriseDateTime.add(1, "day");
                // add optional sun event offset, if specified (again)
                sunriseDateTime = sunriseDateTime.add(Number(node.sunriseOffset), "minutes");
            }
            if (now.isAfter(sunsetDateTime)) {
                // get tomorrow's sunset, since it'll be different
                // sunsetDateTime = spacetime(SunCalc.getTimes(now.add(1, "day").toNativeDate(), node.lat, node.lon)[SUNSET_KEY]).nearest("minute");
                sunsetDateTime = sunsetDateTime.add(1, "day");
                // add optional sun event offset, if specified (again)
                sunsetDateTime = sunsetDateTime.add(Number(node.sunsetOffset), "minutes");
            }

            // log sun events
            if (RED.settings.verbose) {
                node.log(`Sunrise ${sunriseDateTime.format("time")} - Sunset ${sunsetDateTime.format("time")} `);
            }

            // apply selected timezone to selected times (not to sunrise/sunset-- those are based on lat/long)
            const currentTimeZone = now.timezone();
            const selectedTimeZone = spacetime(now.epoch, this.timezone.toLowerCase()).timezone();

            // handler function to convert minute strings (from <option> tags) to spacetime objects, called below
            let getSelectedTimeFromMinuteString = minuteString => {
                const selectedTimeInMinutesAfterMidnight = Number(minuteString);
                let selectedTime = spacetime.now();
                // if less than 1440, what are the time values for the next start and stop time?
                if (selectedTimeInMinutesAfterMidnight < 1440) {
                    // determine offset to get from selected time zone to current timezone
                    // e.g. current (EDT) is -4, selected (PDT) is -7
                    // in order to get from PDT to EDT, you must add 3
                    // (-4) - (-7) = +3
                    const offset = currentTimeZone.current.offset - selectedTimeZone.current.offset;
                    const selectedHourValue = Math.floor(selectedTimeInMinutesAfterMidnight / 60);
                    const selectedMinuteValue = Math.floor(selectedTimeInMinutesAfterMidnight % 60);
                    selectedTime = selectedTime.hour(selectedHourValue).minute(selectedMinuteValue).second(0).millisecond(0);
                    selectedTime = selectedTime.add(offset, "hours");
                    // select the next time if it's in the past
                    if (now.isAfter(selectedTime)) {
                        selectedTime = selectedTime.add(1, "day");
                    }
                } else if (selectedTimeInMinutesAfterMidnight == 5000) { // sunrise
                    selectedTime = sunriseDateTime;
                } else if (selectedTimeInMinutesAfterMidnight == 6000) { // sunset
                    selectedTime = sunsetDateTime;
                }
                return selectedTime;
            };

            // our definitive next ON time
            let selectedOnTime = getSelectedTimeFromMinuteString(node.startt);
            // our definitive next OFF time
            let selectedOffTime = getSelectedTimeFromMinuteString(node.endt);

            // handle the "Start + X Minutes" cases
            if (node.endt >= 10000) {
                // even though the next start time might be tomorrow,
                // the start time + X minutes might still be coming today,
                // so we need to go back a day first
                const selectedOnTimeMinus1Day = selectedOnTime.subtract(1, "day");
                selectedOffTime = selectedOnTimeMinus1Day.add(node.endt - 10000, "minutes");
                // _now_ we can check if the off time is in the past
                if (now.isAfter(selectedOffTime)) {
                    selectedOffTime = selectedOffTime.add(1, "day");
                }
            }

            // handler function for the node payload, called below
            let sendPayload = (payload, nextTime) => {
                // var o = nextTime.goto(selectedTimeZone.name).offset()/60;
                // if (o > 0) { o = "+" + o; }
                // else {o = "-" + o; }
                if (nextTime) {
                    if (payload == 1) {
                        node.status({
                            fill: "yellow",
                            shape: "dot",
                            text: `on until ${nextTime.goto(selectedTimeZone.name).format("time-24")}`
                        });
                    } else {
                        node.status({
                            fill: "blue",
                            shape: "dot",
                            text: `off until ${nextTime.goto(selectedTimeZone.name).format("time-24")}`
                        });
                    }
                } else {
                    if (payload == 1) {
                        node.status({
                            fill: "yellow",
                            shape: "dot",
                            text: `on`
                        });
                    } else {
                        node.status({
                            fill: "blue",
                            shape: "dot",
                            text: `off`
                        });
                    }
                }

                var msg = {};
                if (node.mytopic) {
                    msg.topic = node.mytopic;
                }
                msg.payload = payload;
                node.send(msg);
            };

            var proceed = true;

            // if today is not among the selected days of the week, stop here
            switch (nowNative.getDay()) {
                case 0 : { if (!node.sun) { proceed &= false; } break; }
                case 1 : { if (!node.mon) { proceed &= false; } break; }
                case 2 : { if (!node.tue) { proceed &= false; } break; }
                case 3 : { if (!node.wed) { proceed &= false; } break; }
                case 4 : { if (!node.thu) { proceed &= false; } break; }
                case 5 : { if (!node.fri) { proceed &= false; } break; }
                case 6 : { if (!node.sat) { proceed &= false; } break; }
            }

            if (!proceed) {
                sendPayload(0, selectedOnTime);
                return;
            }

            // if this month is not among the selected months, stop here
            switch (nowNative.getMonth()) {
                case 0 : { if (!node.jan) { proceed &= false; } break; }
                case 1 : { if (!node.feb) { proceed &= false; } break; }
                case 2 : { if (!node.mar) { proceed &= false; } break; }
                case 3 : { if (!node.apr) { proceed &= false; } break; }
                case 4 : { if (!node.may) { proceed &= false; } break; }
                case 5 : { if (!node.jun) { proceed &= false; } break; }
                case 6 : { if (!node.jul) { proceed &= false; } break; }
                case 7 : { if (!node.aug) { proceed &= false; } break; }
                case 8 : { if (!node.sep) { proceed &= false; } break; }
                case 9 : { if (!node.oct) { proceed &= false; } break; }
                case 10: { if (!node.nov) { proceed &= false; } break; }
                case 11: { if (!node.dec) { proceed &= false; } break; }
            }

            if (!proceed) {
                sendPayload(0, selectedOnTime);
                return;
            }

            // if the chronological order is NOW --> ON --> OFF, then now should be OFF
            if (proceed && selectedOffTime.isAfter(selectedOnTime)) {
                sendPayload(0, selectedOnTime);
                return;
            }

            // if the chronological order is NOW --> OFF --> ON, then now should be ON
            if (proceed && selectedOffTime.isBefore(selectedOnTime)) {
                sendPayload(1, selectedOffTime);
                return;
            }

            // Note: we already ensured that all ON or OFF times would be in the future,
            // so there is no midnight wrapping issue.
        });

        var tock = setTimeout(function () {
            node.emit("input", {});
        }, 2000); // wait 2 secs before starting to let things settle down – e.g. UI connect

        var tick = setInterval(function () {
            node.emit("input", {});
        }, 60000); // trigger every 60 secs

        this.on("close", function () {
            if (tock) { clearTimeout(tock); }
            if (tick) { clearInterval(tick); }
        });
    }

    RED.httpAdmin.post("/timeswitch/:id", RED.auth.needsPermission("timeswitch.write"), function (req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                node.emit("input", { payload: "reset" });
                res.sendStatus(200);
            } catch (err) {
                res.sendStatus(500);
                node.error("Inject failed:" + err);
            }
        } else {
            res.sendStatus(404);
        }
    });

    RED.nodes.registerType("timeswitch", TimeswitchNode);
};
