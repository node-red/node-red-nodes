/**
 * Copyright 2013,2015 IBM Corp.
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
    var ArduinoFirmata = require('arduino-firmata');

    // The Board Definition - this opens (and closes) the connection
    function ArduinoNode(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device || null;
        this.repeat = n.repeat||25;
        var node = this;
        node.board = new ArduinoFirmata();
        // TODO: nls
        ArduinoFirmata.list(function (err, ports) {
            if (!node.device) {
                node.log(RED._("arduino.status.connectfirst"));
                node.board.connect();
            }
            else {
                if (ports.indexOf(node.device) === -1) {
                    node.warn(RED._("arduino.errors.devnotfound",{dev:node.device}));
                    node.board.connect();
                }
                else {
                    node.log(RED._("arduino.status.connect",{device:node.device}));
                    node.board.connect(node.device);
                }
            }

            node.board.on('boardReady', function() {
                node.log(RED._("arduino.status.connected",{device:node.board.serialport_name}));
                if (RED.settings.verbose) {
                    node.log(RED._("arduino.status.version",{version:node.board.boardVersion}));
                }
            });
        });

        node.on('close', function(done) {
            if (node.board) {
                try {
                    node.board.close(function() {
                        done();
                        if (RED.settings.verbose) { node.log(RED._("arduino.status.portclosed")); }
                    });
                } catch(e) { done(); }
            } else { done(); }
        });
    }
    RED.nodes.registerType("arduino-board",ArduinoNode);


    // The Input Node
    function DuinoNodeIn(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = n.pin;
        this.state = n.state;
        this.arduino = n.arduino;
        this.serverConfig = RED.nodes.getNode(this.arduino);
        if (typeof this.serverConfig === "object") {
            this.board = this.serverConfig.board;
            var node = this;
            node.status({fill:"red",shape:"ring",text:"node-red:common.status.connecting"});
            node.board.on('connect', function() {
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                //console.log("i",node.state,node.pin);
                if (node.state == "ANALOG") {
                    node.board.on('analogChange', function(e) {
                        if (e.pin == node.pin) {
                            var msg = {payload:e.value, topic:"A"+e.pin};
                            node.send(msg);
                        }
                    });
                }
                if (node.state == "INPUT") {
                    node.board.pinMode(node.pin, ArduinoFirmata.INPUT);
                    node.board.on('digitalChange', function(e) {
                        if (e.pin == node.pin) {
                            var msg = {payload:e.value, topic:e.pin};
                            node.send(msg);
                        }
                    });
                }
                if (node.state == "SYSEX") {
                    node.board.on('sysex', function(e) {
                        var msg = {payload:e, topic:"sysex"};
                        node.send(msg);
                    });
                }
            });
        }
        else {
            this.warn(RED._("arduino.errors.portnotconf"));
        }
    }
    RED.nodes.registerType("arduino in",DuinoNodeIn);


    // The Output Node
    function DuinoNodeOut(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = n.pin;
        this.state = n.state;
        this.arduino = n.arduino;
        this.serverConfig = RED.nodes.getNode(this.arduino);
        if (typeof this.serverConfig === "object") {
            this.board = this.serverConfig.board;
            var node = this;
            node.status({fill:"red",shape:"ring",text:"node-red:common.status.connecting"});

            node.board.on('connect', function() {
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                //console.log("o",node.state,node.pin);
                node.board.pinMode(node.pin, node.state);
                node.on("input", function(msg) {
                    if (node.state === "OUTPUT") {
                        if ((msg.payload === true)||(msg.payload.toString() == "1")||(msg.payload.toString().toLowerCase() == "on")) {
                            node.board.digitalWrite(node.pin, true);
                        }
                        if ((msg.payload === false)||(msg.payload.toString() == "0")||(msg.payload.toString().toLowerCase() == "off")) {
                            node.board.digitalWrite(node.pin, false);
                        }
                    }
                    if (node.state === "PWM") {
                        msg.payload = parseInt((msg.payload * 1) + 0.5);
                        if ((msg.payload >= 0) && (msg.payload <= 255)) {
                            node.board.analogWrite(node.pin, msg.payload);
                        }
                    }
                    if (node.state === "SERVO") {
                        msg.payload = parseInt((msg.payload * 1) + 0.5);
                        if ((msg.payload >= 0) && (msg.payload <= 180)) {
                            node.board.servoWrite(node.pin, msg.payload);
                        }
                    }
                    if (node.state === "SYSEX") {
                        node.board.sysex(msg.payload);
                    }
                });
            });
        }
        else {
            this.warn(RED._("arduino.errors.portnotconf"));
        }
    }
    RED.nodes.registerType("arduino out",DuinoNodeOut);

    RED.httpAdmin.get("/arduinoports", RED.auth.needsPermission("arduino.read"), function(req,res) {
        ArduinoFirmata.list(function (err, ports) {
            res.json(ports);
        });
    });
}
