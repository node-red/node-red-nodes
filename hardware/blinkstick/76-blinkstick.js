/**
 * Copyright 2013-2014 Agile Innovative Ltd.
 * Based on code written by Dave Conway-Jones, IBM Corp.
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
    var blinkstick = require("blinkstick");

    var availableTasks = ["set_color", "blink", "pulse", "morph"];

    Object.size = function(obj) {
        var size = 0;
        for (var key in obj) { if (obj.hasOwnProperty(key)) { size++; } }
        return size;
    };

    //Helper function to convert decimal number to hex with padding
    function decimalToHex(d, padding) {
        var hex = Number(d).toString(16);
        padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

        while (hex.length < padding) {
            hex = "0" + hex;
        }

        return hex;
    }

    function validateInt(value, defaultValue) {
        return typeof (value) === "undefined" || value === null ? value = defaultValue : parseInt(value);
    }

    function validate(value, defaultValue) {
        return typeof (value) === "undefined" || value === null ? value = defaultValue : value;
    }

    function validatePayloadObject (obj) {
        var
            task = validate(obj.task),
            delay = validateInt(obj.delay),
            repeats = validateInt(obj.repeats),
            duration = validateInt(obj.duration),
            steps = validateInt(obj.steps),
            repeat = validate(obj.repeat),
            color = validate(obj.color);

        if (typeof(task) !== 'undefined' && availableTasks.indexOf(task) === -1) {
            return "Task is invalid";
        }

        if (typeof(color) === 'undefined') {
            return "Color parameter is not set";
        }

        return { 'task': task, 'delay': delay, 'repeats': repeats, 'duration': duration, 'steps': steps,
            'repeat': repeat, 'color': color };
    }

    function BlinkStick(n) {
        RED.nodes.createNode(this,n);

        this.name = n.name;
        this.serial = n.serial;
        this.task = n.task || "set_color";
        this.delay = n.delay || 500;
        this.repeats = n.repeats || 1;
        this.duration = n.duration || 1000;
        this.steps = n.steps || 50;
        this.repeat = n.repeat;
        this.closing = false;
        this.color = '';
        this.previousColor = '';

        var p1 = /[0-9]+,[0-9]+,[0-9]+/;
        var node = this;
        //Keeps track for active animations
        var animationComplete = true;

        //Find BlinkStick based on serial number if supplied, otherwise look for first
        //Blinkstick in the USB device list
        var findBlinkStick = function (callback) {
            if (typeof(node.serial) == 'string' && node.serial.replace(/\s+/g,'') !== '') {
                blinkstick.findBySerial(node.serial, function (device) {
                    node.led = device;

                    if (Object.size(node.led) === 0) {
                        node.status({fill:"red",shape:"ring",text:"not found"});
                        node.error("BlinkStick with serial number " + node.serial + " not found");
                    } else {
                        node.status({fill:"green",shape:"dot",text:"connected"});
                        if (callback) { callback(); }
                    }
                });
            } else {
                node.led = blinkstick.findFirst();

                if (Object.size(node.led) === 0) {
                    node.status({fill:"red",shape:"ring",text:"not found"});
                    node.error("No BlinkStick found");
                } else {
                    node.status({fill:"green",shape:"dot",text:"connected"});
                    if (callback) { callback(); }
                }
            }
        };

        //Check if repeat is enabled. Works only for pulse and blink tasks
        var canRepeat = function () {
            return node.task == "pulse" || node.task == "blink";
        };

        //Event handler for all animation complete events
        var blinkstickAnimationComplete = function (err) {
            if (typeof(err) !== 'undefined') {
                node.warn(err);

                if (typeof(err.name) === 'undefined' || err.name !== 'ReferenceError') {
                    //USB error occurred when BlinkStick was animating
                    node.led.close(function () {
                        node.led = undefined;
                        findBlinkStick();
                    });
                }
            }

            animationComplete = true;

            //Apply queued color animation
            if (!node.closing && node.color !== '') {
                //Apply new color only if there was no error or queued color is different from the previous color
                if (typeof(err) === 'undefined' || typeof(err) !== 'undefined' && node.color != node.previousColor) {
                    applyColor();
                }
            }
        };

        var applyColor = function () {
            animationComplete = false;

            //Store the value of color to check if it has changed
            node.previousColor = node.color;

            try {
                //Select animation to perform
                if (node.task == "pulse") {
                    node.led.pulse(node.color, {'duration': node.duration, 'steps': node.steps }, blinkstickAnimationComplete);
                } else if (node.task == "morph") {
                    node.led.morph(node.color, {'duration': node.duration, 'steps': node.steps }, blinkstickAnimationComplete);
                } else if (node.task == "blink") {
                    node.led.blink(node.color,{'repeats': node.repeats, 'delay': node.delay }, blinkstickAnimationComplete);
                } else {
                    node.led.setColor(node.color, blinkstickAnimationComplete);
                }
            } catch (err) {
                if (err.toString().indexOf("setColor") !== -1) {
                    node.led.setColour(node.color, blinkstickAnimationComplete);
                    node.warn("Old version - please upgrade Blinkstick npm");
                }
                else {
                    node.warn("BlinkStick missing ? " + err);
                }
                node.log(err);
                //Reset animation
                animationComplete = true;
                //Clear color
                node.color = '';
                //Look for a BlinkStick
                findBlinkStick();
                return;
            }

            //Clear color value until next one is received, unless repeat option is set to true
            if (!node.repeat || !canRepeat()) {
                node.color = '';
            }
        };

        findBlinkStick();

        this.on("input", function(msg) {
            if (typeof(node.led) !== "undefined") {
                if (typeof(msg.payload) === 'object' ) {
                    // if it's an array then hopefully it's r,g,b,r,g,b or name,name,name
                    if (Array.isArray(msg.payload)) {
                        if (Object.size(node.led) !== 0) {
                            node.led.setMode(2); // put it into ws2812B LED mode
                            var dat = [];
                            for (var i = 0; i < msg.payload.length; i++) {
                                if (typeof msg.payload[i] === "string") { // if string then assume must be colour names
                                    var params = node.led.interpretParameters(msg.payload[i]); // lookup colour code from name
                                    if (params) {
                                        dat.push(params.green);
                                        dat.push(params.red);
                                        dat.push(params.blue);
                                    }
                                    else { node.warn("invalid colour: "+msg.payload[i]); }
                                }
                                else { // otherwise lets use numbers 0-255
                                    dat.push(msg.payload[i+1]);
                                    dat.push(msg.payload[i]);
                                    dat.push(msg.payload[i+2]);
                                    i += 2;
                                }
                            }
                            if ((dat.length % 3) === 0) { // by now length must be a multiple of 3
                                node.led.setColors(0, dat, function(err) {
                                    if (err) { node.log(err); }
                                });
                            }
                            else {
                                node.warn("Colour array length not / 3");
                            }
                            return;
                        } // else if no blinkstick let it get caught below
                    }
                    // not an array - must be the "normal" object....
                    else {
                        var data = validatePayloadObject(msg.payload);
                        if (typeof(data) === 'object') {
                            node.task = data.task ? data.task : node.task;
                            node.delay = data.delay ? data.delay : node.delay;
                            node.repeats = data.repeats ? data.repeats : node.repeats;
                            node.duration = data.duration ? data.duration : node.duration;
                            node.steps = data.steps ? data.steps : node.steps;
                            node.repeat = data.repeat ? data.repeat : node.repeat;
                            node.color = data.color ? data.color : node.color;
                        } else {
                            node.error(data);
                            return;
                        }
                    }
                } else if (p1.test(msg.payload)) {
                    //Color value is represented as "red,green,blue" string of bytes
                    var rgb = msg.payload.split(",");

                    //Convert color value back to HEX string for easier implementation
                    node.color = "#" + decimalToHex(parseInt(rgb[0])&255) +
                        decimalToHex(parseInt(rgb[1])&255) + decimalToHex(parseInt(rgb[2])&255);
                } else {
                    //Sanitize color value
                    node.color = msg.payload.toLowerCase().replace(/\s+/g,'');
                    if (node.color === "amber") { node.color = "#FFBF00"; }
                }

                if (Object.size(node.led) !== 0) {
                    //Start color animation, otherwise the color is queued until current animation completes
                    if (animationComplete) {
                        applyColor();
                    }
                } else {
                    //Attempt to find BlinkStick and start animation if it's found
                    findBlinkStick(function() {
                        if (animationComplete) {
                            applyColor();
                        }
                    });
                }
            }
            else {
                node.status({fill:"red",shape:"ring",text:"not found"});
                node.error("BlinkStick not found",msg);
            }
        });

        this.on("close", function() {
            //Set the flag to finish all animations
            this.closing = true;

            if (Object.size(node.led) !== 0) {
                //Close device and stop animations
                if (typeof this.led.close === "function") { this.led.close(); }
                else { node.warn("Please upgrade blinkstick npm"); }
            }
        });
    }

    RED.nodes.registerType("blinkstick",BlinkStick);

    RED.httpAdmin.get("/blinksticklist", RED.auth.needsPermission("blinkstick.read"), function(req,res) {
        blinkstick.findAllSerials(function(serials) {
            res.json(serials);
        });
    });
};
