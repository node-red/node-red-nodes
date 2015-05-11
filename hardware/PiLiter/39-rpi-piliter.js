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
    var spawn = require('child_process').spawn;
    var fs = require('fs');

    var gpioCommand = __dirname+'/nrgpio';

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        //util.log("Info : Ignoring Raspberry Pi specific node.");
        throw "Info : Ignoring Raspberry Pi specific node.";
    }

    if (!fs.existsSync("/usr/share/doc/python-rpi.gpio")) {
        util.log("[rpi-gpio] Info : Can't find Pi RPi.GPIO python library.");
        throw "Warning : Can't find Pi RPi.GPIO python library.";
    }

    if ( !(1 & parseInt ((fs.statSync(gpioCommand).mode & parseInt ("777", 8)).toString (8)[0]) )) {
        util.log("[rpi-gpio] Error : "+gpioCommand+" needs to be executable.");
        throw "Error : nrgpio must to be executable.";
    }

    function PiLiter(n) {
        RED.nodes.createNode(this,n);
        this.pinv = n.pin;
        this.dir = (n.dir ? 1 : 0) || 0;
        var node = this;

        if (this.pinv === "bar") {
            node.child = spawn(gpioCommand, ["byte",node.dir]);
            node.on("input", function(msg) {
                var out = Number(msg.payload);
                if ((out >= 1) && (out <= 8)) { out = Math.pow(2, out) - 1; }
                else { out = 0; }
                if (node.child !== null) { node.child.stdin.write(out+"\n"); }
                else { node.warn("Command not running"); }
            });
        }
        else if (this.pinv === "meter") {
            node.child = spawn(gpioCommand, ["byte",node.dir]);
            node.on("input", function(msg) {
                var out = Number(msg.payload);
                if ((out >= 1) && (out <= 8)) { out = Math.pow(2, (out-1)); }
                else { out = 0; }
                if (node.child !== null) { node.child.stdin.write(out+"\n"); }
                else { node.warn("Command not running"); }
            });
        }
        else if (this.pinv === "all") {
            node.child = spawn(gpioCommand, ["byte",node.dir]);
            node.on("input", function(msg) {
                var out = msg.payload;
                if ((out === 1)|(out === true)|(out === "1")|(out === "on")) {
                    out = 255;
                }
                else { out = 0; }
                if (node.child !== null) { node.child.stdin.write(out+"\n"); }
                else { node.warn("Command not running"); }
            });
        }
        else if (this.pinv === "pin") {
            node.child = spawn(gpioCommand, ["byte",node.dir]);
            var byte = 0;
            node.on("input", function(msg) {
                if (typeof msg.payload === "object") {
                    var out = Number(msg.payload.led);
                    var l = Number(msg.payload.state);
                    if ((out >= 1) && (out <= 8)) {
                        out = (Math.pow(2, (out-1)));
                        if (l === 0) { out = ~ out; }
                        byte = byte & out & 255;
                        console.log("NOW",byte);
                        if (node.child !== null) { node.child.stdin.write(byte+"\n"); }
                        else { node.warn("Command not running"); }
                    }
                    else { node.warn("Not a valid object - see Info panel."); }
                }
                else { node.warn("Not a valid object - see Info panel."); }
            });
        }
        else {
            node.child = spawn(gpioCommand, ["byte",node.dir]);
            node.on("input", function(msg) {
                var out = Number(msg.payload);
                if ((out >= 0) && (out <= 255)) {
                    if (node.child !== null) { node.child.stdin.write(out+"\n"); }
                    else { node.warn("Command not running"); }
                }
                else { node.warn("Invalid input - not between 0 and 255"); }
            });
        }

        node.on("close", function() {
            if (node.child != null) {
                node.child.kill('SIGKILL');
            }
            if (RED.settings.verbose) { node.log("end"); }
        });
    }
    RED.nodes.registerType("rpi-liter",PiLiter);
}
