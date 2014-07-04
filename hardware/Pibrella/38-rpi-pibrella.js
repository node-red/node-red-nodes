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
    var util = require("util");
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
            "Amber LED":"0",
            "Buzzer ":"1",
            "Red LED":"2",
            "Out E":"3",
            "Out F":"4",
            "Out G":"5",
            "Out H":"6",
            "Green LED":"7",
            "In C":"10",
            "In B":"11",
            "In D":"12",
            "In A":"13",
            "Red Button":"14",
    }
    var tablepin = {
    // WiringPi : Physical
            "0":"Amber",
            "1":"Buzzer",
            "2":"Red",
            "3":"E",
            "4":"F",
            "5":"G",
            "6":"H",
            "7":"Green",
           "10":"C",
           "11":"B",
           "12":"D",
           "13":"A",
           "14":"R",
    }

    function PibrellaIn(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = pintable[n.pin];
        var node = this;

        if (node.pin) {
            exec("gpio mode "+node.pin+" in", function(err,stdout,stderr) {
                if (err) { node.error(err); }
                else {
                    node._interval = setInterval( function() {
                        exec("gpio read "+node.pin, function(err,stdout,stderr) {
                            if (err) { node.error(err); }
                            else {
                                if (node.buttonState !== Number(stdout)) {
                                    var previousState = node.buttonState;
                                    node.buttonState = Number(stdout);
                                    if (previousState !== -1) {
                                        var msg = {topic:"pibrella/"+tablepin[node.pin], payload:node.buttonState};
                                        node.send(msg);
                                    }
                                }
                            }
                        });
                    }, 200);
                }
            });
        }
        else {
            node.error("Invalid GPIO pin: "+node.pin);
        }

        node.on("close", function() {
            clearInterval(node._interval);
        });
    }

    function PibrellaOut(n) {
        RED.nodes.createNode(this,n);
        this.pin = pintable[n.pin];
        var node = this;

        if (node.pin == "1") {
            exec("gpio mode 1 pwm");
            process.nextTick(function() {
                exec("gpio pwm-ms");
                node.on("input", function(msg) {
                    var out = Number(msg.payload);
                    if (out == 1) { // fixed buzz
                        exec("gpio pwm 1 511");
                        exec("gpio pwmc 100");
                    }
                    else if ((out >= 2) && (out <= 9999)) { // set buzz to a value
                        exec("gpio pwm 1 511");
                        exec("gpio pwmc "+out);
                    }
                    else { exec("gpio pwm 1 0"); } // turn it off
                });
            });
        }
        else if (node.pin) {
            process.nextTick(function() {
                exec("gpio mode "+node.pin+" out", function(err,stdout,stderr) {
                    if (err) { node.error(err); }
                    else {
                        node.on("input", function(msg) {
                            if (msg.payload === "true") { msg.payload = true; }
                            if (msg.payload === "false") { msg.payload = false; }
                            var out = Number(msg.payload);
                            if ((out === 0)|(out === 1)) {
                                exec("gpio write "+node.pin+" "+out, function(err,stdout,stderr) {
                                    if (err) { node.error(err); }
                                });
                            }
                            else { node.warn("Invalid input - not 0 or 1"); }
                        });
                    }
                });
            });
        }
        else {
            node.error("Invalid GPIO pin: "+node.pin);
        }

        node.on("close", function() {
            exec("gpio mode "+node.pin+" in");
        });
    }

    //exec("gpio mode 0 out",function(err,stdout,stderr) {
        //if (err) {
            //util.log('[36-rpi-gpio.js] Error: "gpio" command failed for some reason.');
        //}
        //exec("gpio mode 1 out");
        //exec("gpio mode 2 out");
        //exec("gpio mode 3 out");
        //exec("gpio mode 4 out");
        //exec("gpio mode 5 out");
        //exec("gpio mode 6 out");
        //exec("gpio mode 7 out");
        //exec("gpio mode 10 in");
        //exec("gpio mode 11 in");
        //exec("gpio mode 12 in");
        //exec("gpio mode 13 in");
        //exec("gpio mode 14 in");
    //});

    RED.nodes.registerType("rpi-pibrella in",PibrellaIn);
    RED.nodes.registerType("rpi-pibrella out",PibrellaOut);
}
