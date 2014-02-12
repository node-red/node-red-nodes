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
var RED = require(process.env.NODE_RED_HOME+"/red/red");

// Require bonescript
try {
    var bonescript = require("bonescript");
} catch (err) {
    require("util").log("[144-analog-in] Error: cannot find module 'bonescript'");
}

// The main node definition - most things happen in here
function AnalogInputNode(n) {
    // Create a RED node
    RED.nodes.createNode(this, n);

    // Store local copies of the node configuration (as defined in the .html)
    this.topic = n.topic;
    this.pin = n.pin;
    this.breakpoints = n.breakpoints;
    this.averaging = n.averaging;
    if (this.averaging) {
    	this.averages = 10;
    } else {
    	this.averages = 1;
    }

    // Define 'node' to allow us to access 'this' from within callbacks (the 'var' is essential -
    // otherwise there is only one global 'node' for all instances of AnalogInputNode!)
    var node = this;

	// Variables used for input averaging
	var sum;	// accumulates the input readings to be averaged
	var count;	// keep track of the number of measurements made
	
    // The callback function for analogRead. Accumulates the required number of
    // measurements, then divides the total number, applies output scaling and
    // sends the result
    var analogReadCallback = function (x) {
    		sum = sum + x.value;
    		count = count - 1;
    		if (count > 0) {
    			bonescript.analogRead(node.pin, analogReadCallback);
    		} else {
				var msg = {};
				msg.topic = node.topic;
				sum = sum/node.averages;
				// i is the index of the first breakpoint where the 'input' value is strictly
				// greater than the measurement (note: a measurement can never be == 1)
				var i = node.breakpoints.map(function (breakpoint) { return sum >= breakpoint.input; }).indexOf(false);
				msg.payload = node.breakpoints[i-1].output + (node.breakpoints[i].output - node.breakpoints[i-1].output) *
								(sum - node.breakpoints[i-1].input)/(node.breakpoints[i].input - node.breakpoints[i-1].input);
				node.send(msg);
            }
        };

    // If we have a valid pin, set the input event handler to Bonescript's analogRead
    if (["P9_39", "P9_40", "P9_37", "P9_38", "P9_33", "P9_36", "P9_35"].indexOf(node.pin) >= 0) {
        node.on("input", function (msg) {
        		sum = 0;
        		count = node.averages;
        		bonescript.analogRead(node.pin, analogReadCallback);
        	});
    } else {
        node.error("Unconfigured input pin");
    }
}

// Register the node by name. This must be called before overriding any of the Node functions.
RED.nodes.registerType("analog-in", AnalogInputNode);
