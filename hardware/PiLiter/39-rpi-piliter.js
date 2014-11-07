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
    var exec = require('child_process').exec;
    var fs =  require('fs');

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        throw "Info : Ignoring Raspberry Pi specific node.";
    }

    if (!fs.existsSync("/usr/local/bin/gpio")) { // gpio command not installed
        throw "Info : Can't find Raspberry Pi wiringPi gpio command.";
    }

    // Map physical P1 pins to Gordon's Wiring-Pi Pins (as they should be V1/V2 tolerant)
    var pintable = {
    // Physical : WiringPi
        "LED1":"7",
        "LED2":"0",
        "LED3":"2",
        "LED4":"1",
        "LED5":"3",
        "LED6":"4",
        "LED7":"5",
        "LED8":"6"
    }

    var tablepin = {
    // WiringPi : Physical
        "0":"LED2",
        "1":"LED4",
        "2":"LED3",
        "3":"LED5",
        "4":"LED6",
        "5":"LED7",
        "6":"LED8",
        "7":"LED1"
    }

    var barpins = {
        "1":"128",
        "2":"129",
        "3":"133",
        "4":"135",
        "5":"143",
        "6":"159",
        "7":"191",
        "8":"255",
    }

    var meterpins = {
        "1":"128",
        "2":"1",
        "3":"4",
        "4":"2",
        "5":"8",
        "6":"16",
        "7":"32",
        "8":"64",
    }

    function PiLiter(n) {
        RED.nodes.createNode(this,n);
        this.pin = pintable[n.pin];
        this.pinv = n.pin;
        var node = this;

        //Set all pins to outputs
        for (var p = 0; p < 8; p++) {
            exec("gpio mode "+p+" out");
        }
        if (this.pinv === "bar") {
            node.on("input", function(msg) {
                var out = Number(msg.payload);
                if ((out >= 1)&&(out <= 8)) { exec("gpio wb "+barpins[out]); }
                else { exec("gpio wb 0"); }
            });
        }
        else if (this.pinv === "meter") {
            node.on("input", function(msg) {
                var out = Number(msg.payload);
                if ((out >= 1)&&(out <= 8)) { exec("gpio wb "+meterpins[out]); }
                else { exec("gpio wb 0"); }
            });
        }
        else if (this.pinv === "all") {
            node.on("input", function(msg) {
                var out = msg.payload;
                if ((out === 1)|(out === true)|(out === "1")|(out === "on")) {
                    exec("gpio wb 255");
                }
                else { exec("gpio wb 0"); }
            });
        }
        else if (this.pinv === "pin") {
            node.on("input", function(msg) {
                if (typeof msg.payload === "object") {
                    var out = Number(msg.payload.led);
                    var l = msg.payload.state;
                    if ((out >= 1)&&(out <= 8)) {
                        exec("gpio write "+pintable["LED"+out]+" "+l);
                    }
                    else { node.warn("Not a valid object - see Info panel."); }
                }
                else { node.warn("Not a valid object - see Info panel."); }
            });
        }
        else {
            node.on("input", function(msg) {
                var out = Number(msg.payload);
                if ((out >= 0)&&(out <= 255)) {
                    var val = 0;
                    for (var i = 0; i < 8; i ++) {
                        val += ((out & 0x01) << pintable["LED"+(i+1)]);
                        out = out >> 1;
                    }
                    exec("gpio wb "+val);
                }
                else { node.warn("Invalid input - not between 0 and 255"); }
            });
        }
        node.on("close", function() {
            exec("gpio wb 0");
        });
    }
    RED.nodes.registerType("rpi-liter",PiLiter);
}
