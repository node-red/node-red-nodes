/**
 * Copyright 2013,2016 IBM Corp.
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

    var Board = require('firmata');
    var SP = require('firmata/node_modules/serialport');

    // The Board Definition - this opens (and closes) the connection
    function ArduinoNode(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device || null;
        var node = this;

        node.board = Board(node.device, function(e) {
            //console.log("ERR",e);
            if ((e !== undefined) && (e.toString().indexOf("cannot open") !== -1) ) {
                node.error(RED._("arduino.errors.portnotfound",{device:node.device}));
            }
            else if (e === undefined) {
                node.board.on('ready', function() {
                    node.log(RED._("arduino.status.connected",{device:node.board.sp.path}));
                    if (RED.settings.verbose) {
                        node.log(RED._("arduino.status.version",{version:node.board.firmware.name+"-"+node.board.version.major+"."+node.board.version.minor}));
                    }
                });
            }
            node.board.on('close', function() {
                node.error(RED._("arduino.status.portclosed"));
            });
        });

        node.on('close', function(done) {
            if (node.board) {
                try {
                    node.board.sp.close(function() {
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
            var doit = function() {
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                if (node.state === "ANALOG") {
                    node.board.pinMode(node.pin, 0x02);
                    node.board.analogRead(node.pin, function(v) {
                        node.send({payload:v, topic:"A"+node.pin});
                    });
                }
                if (node.state === "INPUT") {
                    node.board.pinMode(node.pin, 0x00);
                    node.board.digitalRead(node.pin, function(v) {
                        node.send({payload:v, topic:node.pin});
                    });
                }
                if (node.state == "STRING") {
                    node.board.on('string', function(v) {
                        node.send({payload:v, topic:"string"});
                    });
                }
                // node.board.on('close', function() {
                //     node.board.removeAllListeners();
                //     node.status({fill:"grey",shape:"ring",text:"node-red:common.status.not-connected"});
                // });
            }
            if (node.board.isReady) { doit(); }
            else { node.board.on("ready", function() { doit(); }); }
            node.on("close", function() {
                if (node.tout) { clearTimeout(node.tout); }
            })
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
            var doit = function() {
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                node.on("input", function(msg) {
                    if (node.state === "OUTPUT") {
                        node.board.pinMode(node.pin, 0x01);
                        if ((msg.payload === true)||(msg.payload.toString() == "1")||(msg.payload.toString().toLowerCase() == "on")) {
                            node.board.digitalWrite(node.pin, node.board.HIGH);
                        }
                        if ((msg.payload === false)||(msg.payload.toString() == "0")||(msg.payload.toString().toLowerCase() == "off")) {
                            node.board.digitalWrite(node.pin, node.board.LOW);
                        }
                    }
                    if (node.state === "PWM") {
                        node.board.pinMode(node.pin, 0x03);
                        msg.payload = parseInt((msg.payload * 1) + 0.5);
                        if ((msg.payload >= 0) && (msg.payload <= 255)) {
                            node.board.analogWrite(node.pin, msg.payload);
                        }
                    }
                    if (node.state === "SERVO") {
                        node.board.pinMode(node.pin, 0x04);
                        msg.payload = parseInt((msg.payload * 1) + 0.5);
                        if ((msg.payload >= 0) && (msg.payload <= 180)) {
                            node.board.servoWrite(node.pin, msg.payload);
                        }
                    }
                    if (node.state === "SYSEX") {
                        node.board.sysexCommand(msg.payload);
                    }
                    if (node.state === "STRING") {
                        node.board.sendString(msg.payload.toString());
                    }
                });
                // node.board.on('close', function() {
                //     node.status({fill:"grey",shape:"ring",text:"node-red:common.status.not-connected"});
                // });
            }
            if (node.board.isReady) { doit(); }
            else { node.board.on("ready", function() { doit(); }); }
            node.on("close", function() {
                if (node.tout) { clearTimeout(node.tout); }
            })
        }
        else {
            this.warn(RED._("arduino.errors.portnotconf"));
        }
    }
    RED.nodes.registerType("arduino out",DuinoNodeOut);

    RED.httpAdmin.get("/arduinoports", RED.auth.needsPermission("arduino.read"), function(req,res) {
        SP.list(function(error, ports) {
            res.json(ports);
        });

    });
}
