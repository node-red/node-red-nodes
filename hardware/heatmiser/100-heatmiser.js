/**
 * Copyright 2014 Sean Bedford
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
    var Heatmiser = require("heatmiser");

    function HeatmiserInputNode(n) {
        // TODO - holiday and hot water cases when confirmed working
        var DEBUG = false;
        RED.nodes.createNode(this,n);
        this.ip = n.ip || "192.168.0.1";
        this.pin = n.pin || "1234";
        this.pollTime = n.pollTime*60*1000 || 30*60*1000;
        this.pollIntervalRef = undefined;
        var hmoutnode = this;

        this.hm = new Heatmiser(this.ip, this.pin);

        this.hm.on('success', function(data) {
            if (DEBUG) {
                hmoutnode.log("Successfully wrote data. Response : " + JSON.stringify(data));
            }
            hmoutnode.send({topic: "", payload:JSON.stringify(data.dcb)});
        });
        this.hm.on('error', function(data) {
            if (DEBUG) {
                hmoutnode.log("Error during data setting : " + JSON.stringify(data));
            }
            hmoutnode.send(data);
        });

        this.read = function() {
            if (hmoutnode.hm) {
                hmoutnode.hm.read_device();
            }
        };

        if (!this.currentStatus) {
            this.read();
            this.pollIntervalRef = setInterval(this.read, this.pollTime);
        }

        this.on("close", function() {
            if (this.pollIntervalRef) {
                clearInterval(this.pollIntervalRef);
                this.pollIntervalRef = undefined;
            }
        });

        this.on("input", function(message) {
            // Valid inputs are heating:{target:, hold:}, read:, runmode:frost/heating, holiday:{enabled:, time:}, hotwater:{'on':1/0 / 'boost':1/0}
            if (message.payload == "undefined" || !message.payload) {
                message.payload = {read : true};
            }
            if (typeof(message.payload) == "string") {
                message.payload = JSON.parse(message.payload);
            }
            if (message.payload.read) {
                hmoutnode.read();
            }
            else if (message.payload) {
                // Compare message.payload data to confirm valid and send to thermostat
                var validInputs = ["heating", "runmode"];
                for (var key in message.payload) {
                    if (message.payload.hasOwnProperty(key)) {
                        if (validInputs.indexOf(key) < 0) {
                            hmoutnode.log("Warning: Unsupported key ("+key+") passed!");
                            return;
                        }
                    }
                }
                hmoutnode.validateAndWrite(message);
            }
        });
    }
    RED.nodes.registerType("heatmiser-in",HeatmiserInputNode);

    function HeatmiserOutputNode(n) {
        // TODO - holiday and hot water cases when confirmed working
        var DEBUG = false;
        RED.nodes.createNode(this,n);
        this.ip = n.ip || "192.168.0.1";
        this.pin = n.pin || "1234";
        this.multiWriteFunc = undefined;
        var hminnode = this;
        this.pollIntervalRef = undefined;

        this.hm = new Heatmiser(this.ip, this.pin);

        this.hm.on('success', function(data) {
            if (DEBUG) {
                hminnode.log("Successfully wrote data. Response : " + JSON.stringify(data));
            }
            hminnode.currentStatus = data.dcb;
            if (hminnode.multiWriteFunc) {
                hminnode.multiWriteFunc();
                hminnode.multiWriteFunc = undefined;
                return;
            }
            hminnode.send({topic: "", payload:JSON.stringify(data.dcb)});
        });
        this.hm.on('error', function(data) {
            if (DEBUG) {
                hminnode.log("Error during data setting : " + JSON.stringify(data));
            }
            hminnode.send(data);
        });

        this.on("close", function() {
            if (this.pollIntervalRef) {
                clearInterval(this.pollIntervalRef);
                this.pollIntervalRef = undefined;
            }
        });

        this.read = function() {
            if (hminnode.hm) {
                hminnode.hm.read_device();
            }
        };

        if (!this.currentStatus) {
            this.read();
            this.pollIntervalRef = setInterval(this.read, 30*60*1000);
        }

        this.write = function(dcb) {
            if (hminnode.hm) {
                hminnode.hm.write_device(dcb);
            }
        };

        this.validateAndWrite = function(message) {
            for (var key in message.payload) {
                if (message.payload.hasOwnProperty(key)) {
                    // Ensure our valid keys contain valid values
                    switch (key) {
                        case "runmode" : {
                            if (DEBUG) {
                                hminnode.log("Hit the runmode case");
                            }
                            if (message.payload[key] !== "frost" && message.payload[key] !== "heating") {
                                hminnode.log("Warning: Unsupported 'runmode' value passed!");
                                return;
                            }
                            break;
                        }

                        //case "holiday" : {
                            //if (DEBUG) {
                              //hminnode.log("Hit the holiday case");
                            //}
                            //if (!('enabled' in message.payload[key]) && !('time' in message.payload[key])) {
                                //hminnode.log("Warning: Unsupported 'holiday' value passed!");
                                //eturn;
                            //}
                            //var time = message.payload[key].time;
                            //// Ensure hminnode time is a date
                            //if (typeof(time) == "string") {
                                //hminnode.log("Typeof time was " +typeof(message.payload[key].time));
                                //// message.payload[key].time = new Date(message.payload[key].time);
                                //message.payload[key].time = new Date(2014, 02, 15, 12, 0, 0);
                                //hminnode.log("Typeof time is now " +typeof(message.payload[key].time));
                            //}
                            //// Also add in away mode (for hot water) if we're on hols
                            //if (message.payload[key].time) {
                                //message.payload.away_mode = 1;
                            //}
                            //else {
                                //message.payload.away_mode = 0;
                            //}
                            //break;
                        // }

                        //case "hotwater" : {
                            //if (DEBUG) {
                                //hminnode.log("Hit the hotwater case");
                            //}
                            //if (message.payload[key] !== "on" && message.payload[key] !== "boost" && message.payload[key] !== "off") {
                                //hminnode.log("Warning: Unsupported 'hotwater' value passed!");
                                //return;
                            //}
                            //break;
                        // }

                        case "heating" : {
                            // Ensure heating stays last! It's got a multi write scenario
                            if (DEBUG) {
                                hminnode.log("Hit the heating case");
                            }
                            if (!('target' in message.payload[key]) && !('hold' in message.payload[key])) {
                                hminnode.log("Warning: Unsupported 'heating' value passed!");
                                return;
                            }
                            // Set sane temp and time ranges and sanitise to float/int
                            var target = parseFloat(message.payload[key].target);
                            var hold = parseInt(message.payload[key].hold);
                            if (target > 30.0) { message.payload[key].target = 30.0; }
                            else { message.payload[key].target = target; }
                            if (hold > 1440) { message.payload[key].hold = 1440; }
                            else { message.payload[key].hold = hold; }
                            if (target <= 10.0) { message.payload[key].target = 10.0; }
                            else { message.payload[key].target = target; }
                            if (hold <= 0) { message.payload[key].hold = 0; }
                            else { message.payload[key].hold = hold; }

                            // Ensure hminnode runmode == heating first
                            if (hminnode.currentStatus.run_mode === "frost_protection") {
                                // Use the multiWriteFunc as a callback in our success case
                                hminnode.multiWriteFunc = function() {
                                    hminnode.write(message.payload);
                                }
                                hminnode.write({"runmode" : "heating"});
                                // End the flow here to ensure no double-writing
                                return;
                            }
                            break;
                        }

                        default : {
                            break;
                        }
                    }
                    // Valid set of key messages, construct DCB and write
                    var dcb = message.payload;
                    if (DEBUG) {
                        hminnode.log("Injecting " + JSON.stringify(dcb));
                    }
                    hminnode.write(dcb);
                }
            }
        };

        this.on("input", function(message) {
            // Valid inputs are heating:{target:, hold:}, read:, runmode:frost/heating, holiday:{enabled:, time:}, hotwater:{'on':1/0 / 'boost':1/0}
            if (message.payload) {
                if (typeof(message.payload) === "string") {
                    message.payload = JSON.parse(message.payload);
                }
                // Compare message.payload data to confirm valid and send to thermostat
                var validInputs = ["heating", "runmode"];
                for (var key in message.payload) {
                    if (message.payload.hasOwnProperty(key)) {
                        if (validInputs.indexOf(key) < 0) {
                            hminnode.log("Warning: Unsupported key ("+key+") passed!");
                            return;
                        }
                    }
                }
                hminnode.validateAndWrite(message);
            }
            else {
                hminnode.log("Warning: Invalid input passed!");
                return;
            }
        });
    }
    RED.nodes.registerType("heatmiser-out",HeatmiserOutputNode);
}
