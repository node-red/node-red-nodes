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

// Require main module
var RED = require(process.env.NODE_RED_HOME + "/red/red");

// Require bonescript
try {
    var bonescript = require("bonescript");
} catch (err) {
    require("util").log("[145-digital-in] Error: cannot find module 'bonescript'");
}

// discrete-in node constructor
function DiscreteInputNode(n) {
    RED.nodes.createNode(this, n);

    // Store local copies of the node configuration (as defined in the .html)
    this.topic = n.topic;                           // the topic is not currently used
    this.pin = n.pin;                               // The Beaglebone Black pin identifying string
    if (n.activeLow)                                // Set the 'active' state 0 or 1 as appropriate
        this.activeState = 0;
    else
        this.activeState = 1;
    this.updateInterval = n.updateInterval * 1000;  // How often to send totalActiveTime messages
    this.debounce = n.debounce;                     // Enable switch contact debouncing algorithm

    this.interruptAttached = false; // Flag: should we detach interrupt when we are closed?
    this.intervalId = null;         // Remember the timer ID so we can delete it when we are closed
    this.currentState = 0;          // The pin input state "1" or "0"
    this.lastActiveTime = NaN;      // The date (in ms since epoch) when the pin last went high
                                    // switch to process.hrtime()
    this.totalActiveTime = 0;       // The total time in ms that the pin has been high (since reset)
    this.starting = true;
    this.debouncing = false;        // True after a change of state while waiting for the 7ms debounce time to elapse
    
    // Define 'node' to allow us to access 'this' from within callbacks (the 'var' is essential -
    // otherwise there is only one global 'node' for all instances of DiscreteInputNode!)
    var node = this;

    // This function is called by the input pin change-of-state interrupt. If 
    // debounce is disabled, send the output message. Otherwise, if we are
    // currently debouncing, ignore this interrupt. If we are not debouncing,
    // schedule a re-read of the input pin in 7ms time, and set the debouncing flag
    // Note: this function gets called spuriously when the interrupt is first enabled:
    // in this case x.value is undefined - we must test for this
    var interruptCallback = function (x) {
            if (x.value !== undefined && node.currentState !== Number(x.value)) {
                if (node.debounce) {
                    if (node.debouncing === false) {
                        node.debouncing = true;
                        setTimeout(function () { bonescript.digitalRead(node.pin, debounceCallback); }, 7);
                    }
                } else {
                    sendStateMessage(x);
                }
            }
        };

    // This function is called approx 7ms after a potential change-of-state which we
    // are debouncing. Terminate the debounce, and send a message if the state has
    // actually changed
    var debounceCallback = function (x) {
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
            // switch to process.hrtime()
            if (node.currentState === node.activeState) {
                node.lastActiveTime = now;
            } else if (!isNaN(node.lastActiveTime)) {
                node.totalActiveTime += now - node.lastActiveTime;
            }
            var msg = {};
            msg.topic = node.topic;
            msg.payload = node.currentState;
            node.send([msg, null]);
        };
        
    // This function is called by the timer. It updates the ActiveTime variables, and sends a
    // message on the second output with the latest value of the total active time, in seconds
    var timerCallback = function () {
            if (node.currentState === node.activeState) {
                var now = Date.now();
                node.totalActiveTime += now - node.lastActiveTime;
                node.lastActiveTime = now;
                // switch to process.hrtime()
            }
            var msg = {};
            msg.topic = node.topic;
            msg.payload = node.totalActiveTime / 1000;
            node.send([null, msg]);
            // Re-synchronise the pin state if we have missed a state change interrupt for some
            // reason, and we are not in the process of debouncing one
            if (node.debouncing === false) {
                bonescript.digitalRead(node.pin, interruptCallback);
            }
        };

    // This function is called when we receive an input message. If the topic is "load"
    // set the totalActiveTime to the numeric value of the payload, if possible. Otherwise
    // clear the totalActiveTime (so we start counting from zero again)
    var inputCallback = function (ipMsg) {
            if (String(ipMsg.topic).search("load") < 0 || isFinite(ipMsg.payload) == false) {
                node.totalActiveTime = 0;
            } else {
                node.totalActiveTime = Number(ipMsg.payload);
            }
            if (node.currentState === node.activeState) {
                node.lastActiveTime = Date.now();
                // switch to process.hrtime()
            }
            if (node.starting) {
                node.starting = false;
                var msg = [{topic:node.topic}, {topic:node.topic}];
                msg[0].payload = node.currentState;
                msg[1].payload = node.totalActiveTime;
                node.send(msg);
            }
        };

    // If we have a valid pin, set it as an input and read the (digital) state
    if (["P8_7", "P8_8", "P8_9", "P8_10", "P8_11", "P8_12", "P8_13", "P8_14", "P8_15",
         "P8_16", "P8_17", "P8_18", "P8_19", "P8_26", "P9_11", "P9_12", "P9_13", "P9_14",
         "P9_15", "P9_16", "P9_17", "P9_18", "P9_21", "P9_22", "P9_23", "P9_24", "P9_26",
         "P9_27", "P9_30", "P9_41", "P9_42"].indexOf(node.pin) >= 0) {
        // Don't set up interrupts & intervals until after the close event handler has been installed
        process.nextTick(function () {
            bonescript.pinMode(node.pin, bonescript.INPUT);
            bonescript.digitalRead(node.pin, function (x) {
                        // Initialise the currentState and lastActveTime variables based on the value read
                        node.currentState = Number(x.value);
                        if (node.currentState === node.activeState) {
                            node.lastActiveTime = Date.now();
                            // switch to process.hrtime()
                        }
                        // Attempt to attach a change-of-state interrupt handler to the pin. If we succeed,
                        // set the input event and interval handlers, then send an initial message with the
                        // pin state on the first output
                        if (bonescript.attachInterrupt(node.pin, true, bonescript.CHANGE, interruptCallback)) {
                            node.interruptAttached = true;
                            node.on("input", inputCallback);
                            node.intervalId = setInterval(timerCallback, node.updateInterval);
                        } else {
                            node.error("Failed to attach interrupt");
                        }
                        setTimeout(function () { node.emit("input", {}); }, 50);
                    });
                });
    } else {
        node.error("Unconfigured input pin");
    }
}

// Node constructor for pulse-in
// The node constructor
function PulseInputNode(n) {
    RED.nodes.createNode(this, n);

    // Store local copies of the node configuration (as defined in the .html)
    this.topic = n.topic;                           // the topic is not currently used
    this.pin = n.pin;                               // The Beaglebone Black pin identifying string
    this.updateInterval = n.updateInterval * 1000;  // How often to send totalActiveTime messages
    this.countType = n.countType;
    this.countUnit = n.countUnit;
    this.countRate = n.countRate;

    this.interruptAttached = false; // Flag: should we detach interrupt when we are closed?
    this.intervalId = null;         // Remember the timer ID so we can delete it when we are closed
    
    this.pulseTime = [[NaN, NaN], [NaN, NaN]];
    this.pulseCount = 0;

    // Define 'node' to allow us to access 'this' from within callbacks (the 'var' is essential -
    // otherwise there is only one global 'node' for all instances of DiscreteInputNode!)
    var node = this;

    var interruptCallback = function (x) {
            node.pulseTime = node.pulseTime[[1], process.hrtime()];
            node.pulseCount = node.pulseCount + 1;
        };

    var inputCallback = function (msg) {
            if (String(msg.topic).search("load") < 0 || isFinite(msg.payload) == false) {
                node.pulseCount = 0;
            } else {
                node.pulseCount = Number(msg.payload);
            }
        };

    var timerCallback = function () {
            var now = process.hrtime();
            var lastTime = pulseTime[1][0] - pulseTime[0][0] + (pulseTime[1][1] - pulseTime[0][1]) / 1e9;
            var thisTime = now[0] - pulseTime[1][0] + (now[1] - pulseTime[1][1]) / 1e9;
            var msg = [{ topic:node.topic }, { topic:node.topic }];
            msg[0].payload = node.countUnit * node.pulseCount;
            msg[1].payload = node.countRate / Math.max(thisTime, lastTime);
            node.send(msg);
        };

    // If we have a valid pin, set it as an input and read the (digital) state
    if (["P8_7", "P8_8", "P8_9", "P8_10", "P8_11", "P8_12", "P8_13", "P8_14", "P8_15",
         "P8_16", "P8_17", "P8_18", "P8_19", "P8_26", "P9_11", "P9_12", "P9_13", "P9_14",
         "P9_15", "P9_16", "P9_17", "P9_18", "P9_21", "P9_22", "P9_23", "P9_24", "P9_26",
         "P9_27", "P9_30", "P9_41", "P9_42"].indexOf(node.pin) >= 0) {
        // Don't set up interrupts & intervals until after the close event handler has been installed
        process.nextTick(function () {
            bonescript.pinMode(node.pin, bonescript.INPUT);
            bonescript.digitalRead(node.pin, function (x) {
                        // Initialise the currentState based on the value read
                        node.currentState = Number(x.value);
                        // Attempt to attach a change-of-state interrupt handler to the pin. If we succeed,
                        // set the input event and interval handlers, then send an initial message with the
                        // pin state on the first output
                        var interruptType;
                        if (node.countType == "pulse") {
                            interruptType = bonescript.FALLING ;
                        } else {
                            interruptType = bonescript.CHANGE;
                        }
                        if (bonescript.attachInterrupt(node.pin, true, interruptType, interruptCallback)) {
                            node.interruptAttached = true;
                            node.on("input", inputCallback);
                            node.intervalId = setInterval(timerCallback, node.updateInterval);
                        } else {
                            node.error("Failed to attach interrupt");
                        }
                    });
                });
    } else {
        node.error("Unconfigured input pin");
    }
}

// Register the node by name. This must be called before overriding any of the Node functions.
RED.nodes.registerType("discrete-in", DiscreteInputNode);
RED.nodes.registerType("pulse-in", PulseInputNode);

// On close, detach the interrupt (if we attached one) and clear the interval (if we set one)
DiscreteInputNode.prototype.close = function () {
    if (this.interruptAttached) {
        bonescript.detachInterrupt(this.pin);
    }
    if (this.intervalId !== null) {
        clearInterval(this.intervalId);
    }
};

// On close, detach the interrupt (if we attached one) and clear the interval (if we set one)
PulseInputNode.prototype.close = function () {
    if (this.interruptAttached) {
        bonescript.detachInterrupt(this.pin);
    }
    if (this.intervalId !== null) {
        clearInterval(this.intervalId);
    }
};
