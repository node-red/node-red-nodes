/**
 * Copyright 2013 IBM Corp.
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

var RED = require(process.env.NODE_RED_HOME+"/red/red");
var util = require("util");
var exec = require('child_process').exec;
var fs =  require('fs');

if (!fs.existsSync("/usr/local/bin/gpio")) {
    exec("cat /proc/cpuinfo | grep BCM27",function(err,stdout,stderr) {
        if (stdout.indexOf('BCM27') > -1) {
            util.log('[37-rpi-piface.js] Error: Cannot find Wiring-Pi "gpio" command');
        }
        // else not on a Pi so don't worry anyone with needless messages.
    });
    return;
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
var tablepin = {
// WiringPi : Physical
        "200":"S1",
        "201":"S2",
        "202":"S3",
        "203":"S4",
        "204":"I5",
        "205":"I6",
        "206":"I7",
        "207":"I8",
        "208":"O0",
        "209":"O1",
        "210":"O2",
        "211":"O3",
        "212":"O4",
        "213":"O5",
        "214":"O6",
        "215":"O7",
        "200":"L0",
        "201":"L1",
        "202":"L2",
        "203":"L3",
        "204":"L4",
        "205":"L5",
        "206":"L6",
        "207":"L7"
}

function PiFACEInNode(n) {
    RED.nodes.createNode(this,n);
    this.buttonState = -1;
    this.pin = pintable[n.pin];
    this.intype = n.intype;
    var node = this;
    if (node.pin) {
        exec("gpio -p mode "+node.pin+" "+node.intype, function(err,stdout,stderr) {
            if (err) node.error(err);
            else {
                node._interval = setInterval( function() {
                    exec("gpio -p read "+node.pin, function(err,stdout,stderr) {
                        if (err) node.error(err);
                        else {
                            if (node.buttonState !== Number(stdout)) {
                                var previousState = node.buttonState;
                                node.buttonState = Number(stdout);
                                if (previousState !== -1) {
                                    var msg = {topic:"piface/"+tablepin[node.pin], payload:node.buttonState};
                                    node.send(msg);
                                }
                            }
                        }
                    });
                }, 250);
            }
        });
    }
    else {
        node.error("Invalid PiFACE pin: "+node.pin);
    }
}

function PiFACEOutNode(n) {
    RED.nodes.createNode(this,n);
    this.pin = pintable[n.pin];
    var node = this;
    if (node.pin) {
        node.on("input", function(msg) {
            if (msg.payload === "true") msg.payload = true;
            if (msg.payload === "false") msg.payload = false;
            var out = Number(msg.payload);
            if ((out == 0)|(out == 1)) {
                exec("gpio -p write "+node.pin+" "+out, function(err,stdout,stderr) {
                    if (err) node.error(err);
                });
            }
            else node.warn("Invalid input - not 0 or 1");
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
    exec("gpio -p reset",function(err,stdout,stderr) {
        if (err) {
            util.log('[37-rpi-piface.js] Error: "gpio -p reset" command failed for some reason.');
        }
        RED.nodes.registerType("rpi-piface in",PiFACEInNode);
        RED.nodes.registerType("rpi-piface out",PiFACEOutNode);
        PiFACEInNode.prototype.close = function() {
            clearInterval(this._interval);
        }
        PiFACEOutNode.prototype.close = function() {
        }
    });
});
