/**
 * Copyright 2013,2014 IBM Corp.
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
    var fs = require('fs');

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        throw "Info : Ignoring Raspberry Pi specific node.";
    }

    if (!fs.existsSync("/usr/local/bin/gpio")) { // gpio command not installed
        throw "Info : Can't find Raspberry Pi wiringPi gpio command.";
    }

    // Map names of pins to Gordon's gpio PiFace pin numbers
    var pintable = {
        // Physical : WiringPi
        "Button S1":"200",
        "Button S2":"201",
        "Button S3":"202",
        "Button S4":"203",
        "Input 5":"204",
        "Input 6":"205",
        "Input 7":"206",
        "Input 8":"207",
        "Output0":"208",
        "Output1":"209",
        "Output2":"210",
        "Output3":"211",
        "Output4":"212",
        "Output5":"213",
        "Output6":"214",
        "Output7":"215",
        "LED 0 / Relay 0":"200",
        "LED 1 / Relay 1":"201",
        "LED 2":"202",
        "LED 3":"203",
        "LED 4":"204",
        "LED 5":"205",
        "LED 6":"206",
        "LED 7":"207"
    }

    function PiFACEInNode(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.npin = n.pin;
        this.pin = pintable[n.pin];
        this.intype = n.intype;
        this.read = n.read || false;
        if (this.read) { this.buttonState = -2; }
        var node = this;
        if (node.pin) {
            exec("gpio -p mode "+node.pin+" "+node.intype, function(err,stdout,stderr) {
                if (err) { node.error(err); }
                else {
                    node._interval = setInterval( function() {
                        exec("gpio -p read "+node.pin, function(err,stdout,stderr) {
                            if (err) { node.error(err); }
                            else {
                                if (node.buttonState !== Number(stdout)) {
                                    var previousState = node.buttonState;
                                    node.buttonState = Number(stdout);
                                    if (previousState !== -1) {
                                        var msg = {topic:"piface/"+node.npin, payload:node.buttonState};
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
            node.error("Invalid PiFACE pin: "+node.pin);
        }
        node.on("close", function() {
            clearInterval(node._interval);
        });
    }

    function PiFACEOutNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = pintable[n.pin];
        var node = this;
        if (node.pin) {
            if (node.set) {
                exec("gpio -p write "+node.pin+" "+node.level, function(err,stdout,stderr) {
                    if (err) { node.error(err); }
                });
            }
            node.on("input", function(msg) {
                if (msg.payload === "true") { msg.payload = true; }
                if (msg.payload === "false") { msg.payload = false; }
                var out = Number(msg.payload);
                if ((out === 0)|(out === 1)) {
                    exec("gpio -p write "+node.pin+" "+out, function(err,stdout,stderr) {
                        if (err) { node.error(err); }
                    });
                }
                else { node.warn("Invalid input - not 0 or 1"); }
            });
        }
        else {
            node.error("Invalid PiFACE pin: "+node.pin);
        }
    }


    exec("gpio load spi",function(err,stdout,stderr) {
        if (err) {
            util.log('[37-rpi-piface.js] Error: "gpio load spi" command failed for some reason.');
        }
        RED.nodes.registerType("rpi-piface in",PiFACEInNode);
        RED.nodes.registerType("rpi-piface out",PiFACEOutNode);
    });
}
