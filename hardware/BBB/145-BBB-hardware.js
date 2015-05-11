/**
 * Copyright 2014 Maxwell R Hadley
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

module.exports = function (RED) {
    "use strict";
    var bonescript, adjustName, setPinMode;
    var analogInputPins = ["P9_39", "P9_40", "P9_37", "P9_38", "P9_33", "P9_36", "P9_35"];
    var gpioPins = ["P8_7", "P8_8", "P8_9", "P8_10", "P8_11", "P8_12", "P8_13", "P8_14", "P8_15",
        "P8_16", "P8_17", "P8_18", "P8_19", "P8_26", "P9_11", "P9_12", "P9_13", "P9_14",
        "P9_15", "P9_16", "P9_17", "P9_18", "P9_21", "P9_22", "P9_23", "P9_24", "P9_26",
        "P9_27", "P9_30", "P9_41", "P9_42"];
    var usrLEDs = ["USR0", "USR1", "USR2", "USR3"];
    // Load the hardware library and set up polymorphic functions to suit it. Prefer
    // octalbonescript (faster & less buggy) but drop back to bonescript if not available
    try {
        bonescript = require("octalbonescript");
        adjustName = function (pin) {
            if (pin === "P8_7") {
                pin = "P8_07";
            } else if (pin === "P8_8") {
                pin = "P8_08";
            } else if (pin === "P8_9") {
                pin = "P8_09";
            }
            return pin;
        };
        setPinMode = function (pin, direction, callback) {
            bonescript.pinMode(pin, direction, callback);
        }
    } catch (e) {
        try {
            bonescript = require("bonescript");
            adjustName = function (pin) {
                return pin;
            };
            setPinMode = function (pin, direction, callback) {
                bonescript.pinMode(pin, direction, undefined, undefined, undefined, callback);
            }
        } catch (er) {
            throw "Info : Ignoring Beaglebone specific node.";
        }
    }

    // Node constructor for bbb-analogue-in
    function AnalogueInputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;
        this.pin = n.pin;                               // The Beaglebone Black pin identifying string
        this._pin = adjustName(this.pin);               // Adjusted for Octal if necessary
        this.breakpoints = n.breakpoints;
        this.averaging = n.averaging;
        if (this.averaging) {
            this.averages = 10;
        } else {
            this.averages = 1;
        }

        // Variables used for input averaging
        var sum;    // accumulates the input readings to be averaged
        var count;  // keep track of the number of measurements made

        // The callback function for analogRead. Accumulates the required number of
        // measurements, then divides the total number, applies output scaling and
        // sends the result
        var analogReadCallback = function (x) {
            sum = sum + x.value;
            count = count - 1;
            if (count > 0) {
                bonescript.analogRead(node._pin, analogReadCallback);
            } else {
                var msg = {};
                msg.topic = node.topic;
                sum = sum/node.averages;
                // i is the index of the first breakpoint where the 'input' value is strictly
                // greater than the measurement (note: a measurement can never be == 1)
                var i = node.breakpoints.map(function (breakpoint) {
                    return sum >= breakpoint.input;
                }).indexOf(false);
                msg.payload = node.breakpoints[i - 1].output + (node.breakpoints[i].output - node.breakpoints[i - 1].output)*
                (sum - node.breakpoints[i - 1].input)/(node.breakpoints[i].input - node.breakpoints[i - 1].input);
                node.send(msg);
            }
        };

        // If we have a valid pin, set the input event handler to Bonescript's analogRead
        if (analogInputPins.indexOf(node.pin) >= 0) {
            node.on("input", function () {
                sum = 0;
                count = node.averages;
                bonescript.analogRead(node._pin, analogReadCallback);
            });
        } else {
            node.error("Unconfigured input pin");
        }
    }

    // Node constructor for bbb-discrete-in
    function DiscreteInputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;                           // the topic is not currently used
        this.pin = n.pin;                               // The Beaglebone Black pin identifying string
        this._pin = adjustName(this.pin);               // Adjusted for Octal if necessary
        if (n.activeLow) {                              // Set the 'active' state 0 or 1 as appropriate
            this.activeState = 0;
        } else {
            this.activeState = 1;
        }
        this.updateInterval = n.updateInterval*1000;    // How often to send totalActiveTime messages
        this.debounce = n.debounce;                     // Enable switch contact debouncing algorithm
        if (n.outputOn === "rising") {
            this.activeEdges = [false, true];
        } else if (n.outputOn === "falling") {
            this.activeEdges = [true, false];
        } else if (n.outputOn === "both") {
            this.activeEdges = [true, true];
        } else {
            node.error("Invalid edge type: " + n.outputOn);
        }

        // Working variables
        this.interruptAttached = false; // Flag: should we detach interrupt when we are closed?
        this.intervalId = null;         // Remember the timer ID so we can delete it when we are closed
        this.currentState = 0;          // The pin input state "1" or "0"
        this.lastActiveTime = NaN;      // The date (in ms since epoch) when the pin last went high
        // switch to process.hrtime()
        this.totalActiveTime = 0;       // The total time in ms that the pin has been high (since reset)
        this.starting = true;
        this.debouncing = false;        // True after a change of state while waiting for the 7ms debounce time to elapse
        this.debounceTimer = null;

        // This function is called by the input pin change-of-state interrupt. If
        // debounce is disabled, send the output message. Otherwise, if we are
        // currently debouncing, ignore this interrupt. If we are not debouncing,
        // schedule a re-read of the input pin in 7ms time, and set the debouncing flag
        // Note: if x has an 'attached' field and no 'value' field, the callback is reporting
        // the success or failure of attaching the interrupt - we must handle this
        var interruptCallback = function (x) {
            if (x.value === undefined) {
                if (x.attached === true) {
                    node.interruptAttached = true;
                    node.on("input", inputCallback);
                    node.intervalId = setInterval(timerCallback, node.updateInterval);
                } else {
                    node.error("Failed to attach interrupt");
                }
            } else if (node.currentState !== Number(x.value)) {
                if (node.debounce) {
                    if (node.debouncing === false) {
                        node.debouncing = true;
                        node.debounceTimer = setTimeout(function () {
                            bonescript.digitalRead(node._pin, debounceCallback);
                        }, 7);
                    }
                } else {
                    sendStateMessage(x);
                }
            }
        };

        // This function is called approx 7ms after a potential change-of-state which is
        // being debounced. Terminate the debounce, and send a message if the state has
        // actually changed
        var debounceCallback = function (x) {
            node.debounceTimer = null;
            node.debouncing = false;
            if (x.value !== undefined && node.currentState !== Number(x.value)) {
                sendStateMessage(x);
            }
        };

        // This function is called when either the interruptCallback or the debounceCallback
        // have determined we have a 'genuine' change of state. Update the currentState and
        // ActiveTime variables, and send a message on the first output with the new state
        var sendStateMessage = function (x) {
            node.currentState = Number(x.value);
            var now = Date.now();
            if (node.currentState === node.activeState) {
                node.lastActiveTime = now;
            } else if (!isNaN(node.lastActiveTime)) {
                node.totalActiveTime += now - node.lastActiveTime;
            }
            if (node.activeEdges[node.currentState]) {
                var msg = {};
                msg.topic = node.topic;
                msg.payload = node.currentState;
                node.send([msg, null]);
            }
        };

        // This function is called by the timer. It updates the ActiveTime variables, and sends a
        // message on the second output with the latest value of the total active time, in seconds
        var timerCallback = function () {
            if (node.currentState === node.activeState) {
                var now = Date.now();
                node.totalActiveTime += now - node.lastActiveTime;
                node.lastActiveTime = now;
            }
            var msg = {};
            msg.topic = node.topic;
            msg.payload = node.totalActiveTime/1000;
            node.send([null, msg]);
            // Re-synchronise the pin state if we have missed a state change interrupt for some
            // reason, and we are not in the process of debouncing one
            if (node.debouncing === false) {
                bonescript.digitalRead(node._pin, interruptCallback);
            }
        };

        // This function is called when we receive an input message. If the topic contains
        // 'load' (case insensitive) set the totalActiveTime to the numeric value of the
        // payload, if possible. Otherwise clear the totalActiveTime (so we start counting
        // from zero again)
        var inputCallback = function (ipMsg) {
            if (String(ipMsg.topic).search(/load/i) < 0 || isFinite(ipMsg.payload) === false) {
                node.totalActiveTime = 0;
            } else {
                node.totalActiveTime = Number(ipMsg.payload);
            }
            if (node.currentState === node.activeState) {
                node.lastActiveTime = Date.now();
            }
            // On startup, send an initial activeTime message, but only send an
            // initial currentState message if we are in both edges active mode
            if (node.starting) {
                node.starting = false;
                var msg;
                if (node.activeEdges[0] && node.activeEdges[1]) {
                    msg = [{topic: node.topic}, {topic: node.topic}];
                    msg[0].payload = node.currentState;
                } else {
                    msg = [null, {topic: node.topic}];
                }
                msg[1].payload = node.totalActiveTime;
                node.send(msg);
            }
        };

        // If we have a valid pin, set it as an input and read the (digital) state
        if (gpioPins.indexOf(node.pin) >= 0) {
            // Don't set up interrupts & intervals until after the close event handler has been installed
            bonescript.detachInterrupt(node._pin);
            process.nextTick(function () {
                setPinMode(node._pin, bonescript.INPUT, function (response, pin) {
                    if (response.value === true) {
                        bonescript.digitalRead(node._pin, function (x) {
                            // Initialise the currentState and lastActiveTime variables based on the value read
                            node.currentState = Number(x.value);
                            if (node.currentState === node.activeState) {
                                node.lastActiveTime = Date.now();
                            }
                            // Attempt to attach a change-of-state interrupt handler to the pin. If we succeed,
                            // the input event and interval handlers will be installed by interruptCallback
                            bonescript.attachInterrupt(node._pin, true, bonescript.CHANGE, interruptCallback);
                            // Send an initial message with the pin state on the first output
                            setTimeout(function () {
                                node.emit("input", {});
                            }, 50);
                        });
                    } else {
                        node.error("Unable to set " + pin + " as input: " + response.err);
                    }
                });
            });
        } else {
            node.error("Unconfigured input pin");
        }
    }

    // Node constructor for bbb-pulse-in
    function PulseInputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;                           // the topic is not currently used
        this.pin = n.pin;                               // The Beaglebone Black pin identifying string
        this._pin = adjustName(this.pin);               // Adjusted for Octal if necessary
        this.updateInterval = n.updateInterval*1000;    // How often to send output messages
        this.countType = n.countType;                   // Sets either 'edge' or 'pulse' counting
        this.countUnit = n.countUnit;                   // Scaling applied to count output
        this.countRate = n.countRate;                   // Scaling applied to rate output

        // Working variables
        this.interruptAttached = false;                 // Flag: should we detach interrupt when we are closed?
        this.intervalId = null;                         // Remember the timer ID so we can delete it when we are closed
        this.pulseCount = 0;                            // (Unscaled) total pulse count
        // Hold the hrtime of the last two pulses (with ns resolution)
        this.pulseTime = [[NaN, NaN], [NaN, NaN]];

        // Called by the edge or pulse interrupt. Record the pulse time and count the pulse
        // Note: if x has an 'attached' field and no 'value' field, the callback is reporting
        // the success or failure of attaching the interrupt - we must handle this
        var interruptCallback = function (x) {
            if (x.value === undefined) {
                if (x.attached === true) {
                    node.interruptAttached = true;
                    node.on("input", inputCallback);
                    node.intervalId = setInterval(timerCallback, node.updateInterval);
                } else {
                    node.error("Failed to attach interrupt");
                }
            } else {
                node.pulseTime = [node.pulseTime[1], process.hrtime()];
                node.pulseCount = node.pulseCount + 1;
            }
        };

        // Called when an input message arrives. If the topic contains 'load' (case
        // insensitive) and the payload is a valid number, set the count to that
        // number, otherwise set it to zero
        var inputCallback = function (msg) {
            if (String(msg.topic).search(/load/i) < 0 || isFinite(msg.payload) === false) {
                node.pulseCount = 0;
            } else {
                node.pulseCount = Number(msg.payload);
            }
        };

        // Called by the message timer. Send two messages: the scaled pulse count on
        // the first output and the scaled instantaneous pulse rate on the second.
        // The instantaneous pulse rate is the reciprocal of the larger of either the
        // time interval between the last two pulses, or the time interval since the last pulse.
        var timerCallback = function () {
            var now = process.hrtime();
            var lastTime = node.pulseTime[1][0] - node.pulseTime[0][0] + (node.pulseTime[1][1] - node.pulseTime[0][1])/1e9;
            var thisTime = now[0] - node.pulseTime[1][0] + (now[1] - node.pulseTime[1][1])/1e9;
            var msg = [{topic: node.topic}, {topic: node.topic}];
            msg[0].payload = node.countUnit*node.pulseCount;
            // At startup, pulseTime contains NaN's: force the rate output to 0
            msg[1].payload = node.countRate/Math.max(thisTime, lastTime) || 0;
            node.send(msg);
        };

        // If we have a valid pin, set it as an input and read the (digital) state
        if (gpioPins.indexOf(node.pin) >= 0) {
            // Don't set up interrupts & intervals until after the close event handler has been installed
            bonescript.detachInterrupt(node._pin);
            process.nextTick(function () {
                setPinMode(node._pin, bonescript.INPUT, function (response, pin) {
                    if (response.value === true) {
                        bonescript.digitalRead(node._pin, function (x) {
                            // Initialise the currentState based on the value read
                            node.currentState = Number(x.value);
                            // Attempt to attach an interrupt handler to the pin. If we succeed,
                            // set the input event and interval handlers
                            var interruptType;
                            if (node.countType === "pulse") {
                                // interruptType = bonescript.FALLING; <- doesn't work in v0.2.4
                                interruptType = bonescript.RISING;
                            } else {
                                interruptType = bonescript.CHANGE;
                            }
                            // Attempt to attach the required interrupt handler to the pin. If we succeed,
                            // the input event and interval handlers will be installed by interruptCallback
                            bonescript.attachInterrupt(node._pin, true, interruptType, interruptCallback)
                        });
                    } else {
                        node.error("Unable to set " + pin + " as input: " + response.err);
                    }
                });
            });
        } else {
            node.error("Unconfigured input pin");
        }
    }

    // Node constructor for bbb-discrete-out
    function DiscreteOutputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;                           // the topic is not currently used
        this.pin = n.pin;                               // The Beaglebone Black pin identifying string
        this._pin = adjustName(this.pin);               // Adjusted for Octal if necessary
        this.defaultState = Number(n.defaultState);     // What state to set up as
        this.inverting = n.inverting;
        this.toggle = n.toggle;

        // Working variables
        this.currentState = this.defaultState;

        // If the input message payload is numeric, values > 0.5 are 'true', otherwise use
        // the truthiness of the payload. Apply the inversion flag before setting the output
        var inputCallback = function (msg) {
            var newState;
            if (node.toggle) {
                newState = node.currentState === 0 ? 1 : 0;
            } else {
                if (isFinite(Number(msg.payload))) {
                    newState = Number(msg.payload) > 0.5;
                } else if (msg.payload) {
                    newState = true;
                } else {
                    newState = false;
                }
                if (node.inverting) {
                    newState = !newState;
                }
            }
            bonescript.digitalWrite(node._pin, newState ? 1 : 0);
            node.send({topic: node.topic, payload: newState});
            node.currentState = newState;
        };

        // If we have a valid pin, set it as an output and set the default state
        if (gpioPins.concat(usrLEDs).indexOf(node.pin) >= 0) {
            // Don't set up interrupts & intervals until after the close event handler has been installed
            bonescript.detachInterrupt(node._pin);
            process.nextTick(function () {
                setPinMode(node._pin, bonescript.OUTPUT, function (response, pin) {
                    if (response.value === true) {
                        node.on("input", inputCallback);
                        setTimeout(function () {
                            bonescript.digitalWrite(node._pin, node.defaultState);
                        }, 50);
                    } else {
                        node.error("Unable to set " + pin + " as output: " + response.err);
                    }
                });
            });
        } else {
            node.error("Unconfigured output pin");
        }
    }

    // Node constructor for bbb-pulse-out
    function PulseOutputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;                           // the topic is not currently used
        this.pin = n.pin;                               // The Beaglebone Black pin identifying string
        this._pin = adjustName(this.pin);               // Adjusted for Octal if necessary
        this.pulseState = Number(n.pulseState);         // What state the pulse will be..
        this.defaultState = this.pulseState === 1 ? 0 : 1;
        this.retriggerable = n.retriggerable;
        this.pulseTime = n.pulseTime*1000;              // Pulse width in milliseconds

        // Working variables
        this.pulseTimer = null;                         // Non-null while a pulse is being generated

        // Generate a pulse in response to an input message. If the topic includes the text
        // 'time' (case insensitive) and the payload is numeric, use this value as the
        // pulse time. Otherwise use the value from the properties dialog.
        // If the resulting pulse time is < 1ms, do nothing.
        // If the pulse mode is not retriggerable, then if no pulseTimer is active, generate
        // a pulse. If the pulse mode is retriggerable, and a pulseTimer is active, cancel it.
        // If no timer is active, set the pulse output. In both cases schedule a new pulse
        // timer.
        var inputCallback = function (msg) {
            var time = node.pulseTime;
            if (String(msg.topic).search(/time/i) >= 0 && isFinite(msg.payload)) {
                time = msg.payload*1000;
            }
            if (time >= 1) {
                if (node.retriggerable === false) {
                    if (node.pulseTimer === null) {
                        node.pulseTimer = setTimeout(endPulseCallback, time);
                        bonescript.digitalWrite(node._pin, node.pulseState);
                        node.send({topic: node.topic, payload: node.pulseState});
                    }
                } else {
                    if (node.pulseTimer !== null) {
                        clearTimeout(node.pulseTimer);
                    } else {
                        bonescript.digitalWrite(node._pin, node.pulseState);
                        node.send({topic: node.topic, payload: node.pulseState});
                    }
                    node.pulseTimer = setTimeout(endPulseCallback, time);
                }
            }
        };

        // At the end of the pulse, restore the default state and set the timer to null
        var endPulseCallback = function () {
            node.pulseTimer = null;
            bonescript.digitalWrite(node._pin, node.defaultState);
            node.send({topic: node.topic, payload: node.defaultState});
        };

        // If we have a valid pin, set it as an output and set the default state
        if (gpioPins.concat(usrLEDs).indexOf(node.pin) >= 0) {
            // Don't set up interrupts & intervals until after the close event handler has been installed
            bonescript.detachInterrupt(node._pin);
            process.nextTick(function () {
                setPinMode(node._pin, bonescript.OUTPUT, function (response, pin) {
                    if (response.value === true) {
                        node.on("input", inputCallback);
                        // Set the pin to the default state once the dust settles
                        setTimeout(endPulseCallback, 50);
                    } else {
                        node.error("Unable to set " + pin + " as output: " + response.err);
                    }
                });
            });
        } else {
            node.error("Unconfigured output pin");
        }
    }

    // Register the nodes by name. This must be called before overriding any of the Node functions.
    RED.nodes.registerType("bbb-analogue-in", AnalogueInputNode);
    RED.nodes.registerType("bbb-discrete-in", DiscreteInputNode);
    RED.nodes.registerType("bbb-pulse-in", PulseInputNode);
    RED.nodes.registerType("bbb-discrete-out", DiscreteOutputNode);
    RED.nodes.registerType("bbb-pulse-out", PulseOutputNode);

    // On close, detach the interrupt (if we attached one) and clear any active timers
    DiscreteInputNode.prototype.close = function () {
        if (this.interruptAttached) {
            bonescript.detachInterrupt(this._pin);
        }
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
        }
        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
        }
    };

    // On close, detach the interrupt (if we attached one) and clear the interval (if we set one)
    PulseInputNode.prototype.close = function () {
        if (this.interruptAttached) {
            bonescript.detachInterrupt(this._pin);
        }
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
        }
    };

    // On close, clear an active pulse timer
    PulseOutputNode.prototype.close = function () {
        if (this.pulseTimer !== null) {
            clearTimeout(this.pulseTimer);
        }
    };
};
