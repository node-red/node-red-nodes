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

// The node constructor
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

    this.interruptAttached = false; // Flag: should we detach interrupt when we are closed?
    this.intervalId = null;         // Remember the timer ID so we can delete it when we are closed
    this.currentState = 0;          // The pin input state "1" or "0"
    this.lastActiveTime = NaN;      // The date (in ms since epoch) when the pin last went high
    this.totalActiveTime = 0;       // The total time in ms that the pin has been high (since reset)
    this.starting = true;
    
    // Define 'node' to allow us to access 'this' from within callbacks (the 'var' is essential -
    // otherwise there is only one global 'node' for all instances of DiscreteInputNode!)
    var node = this;

    // This function is called whenever the input pin changes state. We update the currentState
    // and the ActiveTime variables, and send a message on the first output with the new state
    // Note: this function gets called spuriously when the interrupt is first enabled: in this
    // case x.value is undefined - we must test for this
    var interruptCallback = function (x) {
            node.log("interruptCallback: x.value = " + x.value);
            node.log("interruptCallback: node.currentState = " + node.currentState);
            node.log("interruptCallback: node.totalActiveTime = " + node.totalActiveTime);
            node.log("interruptCallback: node.lastActiveTime = " + node.lastActiveTime);
            if (node.currentState === x.value - 0) {
                node.log("Spurious interrupt: " + x.value);
            } else if (x.value != undefined) {
                node.currentState = x.value - 0;
                var now = Date.now();
                if (node.currentState === node.activeState) {
                    node.lastActiveTime = now;
                } else if (!isNaN(node.lastActiveTime)) {
                    node.totalActiveTime += now - node.lastActiveTime;
                }
                var msg = {};
                msg.topic = node.topic;
                msg.payload = node.currentState;
                node.send([msg, null]);
            }
        };

    // This function is called by the timer. It updates the ActiveTime variables, and sends a
    // message on the second output with the latest value of the total active time, in seconds
    var timerCallback = function () {
            node.log("timerCallback: node.currentState = " + node.currentState);
            node.log("timerCallback: node.totalActiveTime = " + node.totalActiveTime);
            node.log("timerCallback: node.lastActiveTime = " + node.lastActiveTime);
            if (node.currentState === node.activeState) {
                var now = Date.now();
                node.totalActiveTime += now - node.lastActiveTime;
                node.lastActiveTime = now;
            }
            var msg = {};
            msg.topic = node.topic;
            msg.payload = node.totalActiveTime / 1000;
            node.send([null, msg]);
        };

    // This function is called when we receive an input message. Clear the ActiveTime variables
    // (so we start counting from zero again)
    var inputCallback = function (msg) {
            node.log("inputCallback: node.currentState = " + node.currentState);
            node.log("inputCallback: node.totalActiveTime = " + node.totalActiveTime);
            node.log("inputCallback: node.lastActiveTime = " + node.lastActiveTime);
            node.totalActiveTime = 0;
            if (node.currentState === node.activeState) {
                node.lastActiveTime = Date.now();
            }
            if (node.starting) {
                node.starting = false;
                var msg = [{topic:node.topic}, {topic:node.topic}];
                msg[0].payload = node.currentState;
                msg[1].payload = node.totalActiveTime;
                node.send(msg);
                node.log("Initial message: " + msg[0].payload + " " + msg[1].payload);
                node.log("currentState: " + node.currentState);
                node.log("activeTime: " + node.totalActiveTime);
            }
        };

    // If we have a valid pin, set it as an input and read the (digital) state
    if (["P8_7", "P8_8", "P8_9", "P8_10", "P8_11", "P8_12", "P8_13", "P8_14", "P8_15",
         "P8_16", "P8_17", "P8_18", "P8_19", "P8_26", "P9_11", "P9_12", "P9_13", "P9_14",
         "P9_15", "P9_16", "P9_17", "P9_18", "P9_21", "P9_22", "P9_23", "P9_24", "P9_26",
         "P9_27", "P9_30", "P9_41", "P9_42"].indexOf(node.pin) >= 0) {
        setTimeout(function () {
            bonescript.pinMode(node.pin, bonescript.INPUT);
            bonescript.digitalRead(node.pin, function (x) {
                        // Initialise the currentState and lastActveTime variables based on the value read
                        node.log("digitalRead: x.value = " + x.value);
                        node.log("digitalRead: node.currentState = " + node.currentState);
                        node.log("digitalRead: node.totalActiveTime = " + node.totalActiveTime);
                        node.log("digitalRead: node.lastActiveTime = " + node.lastActiveTime);
                        node.currentState = x.value - 0;
                        node.log("First read - currentState: " + node.currentState);
                        if (node.currentState === node.activeState) {
                            node.lastActiveTime = Date.now();
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
                }, 50);
    } else {
        node.error("Unconfigured input pin");
    }
}

// Register the node by name. This must be called before overriding any of the Node functions.
RED.nodes.registerType("discrete-in", DiscreteInputNode);

// On close, detach the interrupt (if we attached one) and clear the interval (if we set one)
DiscreteInputNode.prototype.close = function () {
    if (this.interruptAttached) {
        bonescript.detachInterrupt(this.pin);
    }
    if (this.intervalId !== null) {
        clearInterval(this.intervalId);
    }
};
