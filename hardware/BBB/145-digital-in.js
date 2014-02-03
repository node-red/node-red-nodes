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
	var bs = require("bonescript");
} catch(err) {
	require("util").log("[BBB-discrete-in] Error: cannot find module 'bonescript'");
}

// The node constructor
function DiscreteInputNode(n) {
    RED.nodes.createNode(this, n);

    // Store local copies of the node configuration (as defined in the .html)
    this.topic = n.topic;							// the topic is not currently used
    this.pin = n.pin;								// The Beaglebone Black pin identifying string
	this.updateInterval = n.updateInterval*1000; 	// How often to send total active time messages

	this.interruptAttached = false;	// Flag: should we detach interrupt when we are closed?
	this.intervalId = null;			// Remember the timer ID so we can delete it when we are closed
	this.currentState = 0;			// The pin input state "1" or "0"
	this.lastActiveTime = 0;		// The date (in ms since epoch) when the pin last went high
	this.totalActiveTime = 0;		// The total time in ms that the pin has been high (since reset)
	this.starting = true;
	
	// Define 'node' to allow us to access 'this' from within callbacks (the 'var' is essential -
	// otherwise there is only one 'node' for all instances of DiscreteInputNode!)
    var node = this;

	// This function is called whenever the input pin changes state. We update the currentState
	// and the ActiveTime variables, and send a message on the first output with the new state
	var interruptCallback = function (x) {
			if (node.currentState == x.value) {
				node.log("Spurious interrupt: " + x.value);
			} else {
				node.currentState = x.value;
				var now = Date.now();
				if (node.currentState == "1") {
					node.lastActiveTime = now;
				} else {
					node.totalActiveTime += now - node.lastActiveTime;
				}
			}
			var msg = {};
			msg.payload = node.currentState;
			node.send([msg, null]);
		};

	// This function is called by the timer. It updates the ActiveTime variables, and sends a
	// message on the second output with the latest value of the total active time, in seconds
	var timerCallback = function () {
			if (node.currentState == "1") {
				var now = Date.now();
				node.totalActiveTime += now - node.lastActiveTime;
				node.lastActiveTime = now;
			}
			var msg = {};
			msg.payload = node.totalActiveTime/1000;
			node.send([null, msg]);
		};

	// This function is called when we receive an input message. Clear the ActiveTime variables
	// (so we start counting from zero again)
	var inputCallback = function (msg) {
			node.totalActiveTime = 0;
			if (node.currentState == "1") {
				node.lastActiveTime = Date.now();
			}
			if (node.starting) {
			 	node.starting = false;
				var msg1 = {};
				msg1.payload = "hello";
				var msg2 = {};
				msg2.payload = "world";
				this.send([msg1, msg2]);
				node.log("Initial message " + msg1.payload + " " + msg2.payload);
				node.log("currentState: " + node.currentState);
				node.log("activeTime: " + node.totalActiveTime);
				msg1 = null;
				msg2 = null;
			}
		};

	// If we have a valid pin, set it as an input and read the (digital) state
	if (["P8_7", "P8_8", "P8_9", "P8_10", "P8_11", "P8_12", "P8_13", "P8_14", "P8_15",
		 "P8_16", "P8_17", "P8_18", "P8_19", "P8_26", "P9_11", "P9_12", "P9_13", "P9_14",
		 "P9_15", "P9_16", "P9_17", "P9_18", "P9_21", "P9_22", "P9_23", "P9_24", "P9_26",
		 "P9_27", "P9_30", "P9_41", "P9_42"].indexOf(node.pin) >= 0) {
		bs.pinMode(node.pin, bs.INPUT);
		bs.digitalRead(node.pin, function (x) {
				// Initialise the currentState and lastActveTime variables based on the value read
				node.currentState = x.value;
				node.error("First read - currentState: " + node.currentState);
				if (node.currentState == "1") {
					node.lastActiveTime = Date.now();
				}
				// Attempt to attach a change-of-state interrupt handler to the pin. If we succeed,
				// set the input event and interval handlers, then send an initial message with the
				// pin state on the first output
				if (bs.attachInterrupt(node.pin, true, bs.CHANGE, interruptCallback)) {
					node.interruptAttached = true;
					node.on("input", inputCallback);
					node.intervalId = setInterval(timerCallback, node.updateInterval);
				} else {
					node.error("Failed to attach interrupt");
				}
				setTimeout(function () { node.emit("input", {}); }, 50);
			});
	} else {
		node.error("Unconfigured input pin");
	}
}

// Register the node by name. This must be called before overriding any of the Node functions.
RED.nodes.registerType("BBB-discrete-in", DiscreteInputNode);

// On close, detach the interrupt (if we attaced one) and clear the interval (if we set one)
DiscreteInputNode.prototype.close = function () {
	if (this.interruptAttached) {
		bs.detachInterrupt(this.pin);
	}
	if (this.intervalId != null) {
		clearInterval(this.intervalId);
	}
};
