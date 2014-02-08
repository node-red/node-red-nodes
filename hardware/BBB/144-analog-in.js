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

    // Define 'node' to allow us to access 'this' from within callbacks (the 'var' is essential -
    // otherwise there is only one global 'node' for all instances of AnalogInputNode!)
    var node = this;

    // A callback function variable seems to be more reliable than a lambda ?!
    var readCallback = function (x) {
            var msg = {};
            msg.topic = node.topic;
            msg.payload = x.value;
            if (isNaN(x.value)) {
                node.log(x.err);
            }
            node.send(msg);
        };

    // If we have a valid pin, set the input event handler to Bonescript's analogRead
    if (["P9_39", "P9_40", "P9_37", "P9_38", "P9_33", "P9_36", "P9_35"].indexOf(node.pin) >= 0) {
        node.on("input", function (msg) { bonescript.analogRead(node.pin, readCallback) });
    } else {
        node.error("Unconfigured input pin");
    }
}

// Register the node by name. This must be called before overriding any of the Node functions.
RED.nodes.registerType("analog-in", AnalogInputNode);
