/*
  Copyright 2014 Maxwell R Hadley

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var RED = require(process.env.NODE_RED_HOME + "/red/red"),
    rfxcom = require("rfxcom");

// The config node holding the (serial) port device path for one or more rfxcom family nodes
function RfxtrxPortNode(n) {
    RED.nodes.createNode(this,n);
    this.port = n.port;
}

// Register the config node
RED.nodes.registerType("rfxtrx-port", RfxtrxPortNode);

// An object maintaining a pool of config nodes
var rfxcomPool = function () {
        var pool = {};
        return {
            get: function (port, options) {
                // Returns the RfxCom object associated with port, or creates a new RfxCom object,
                // associates it with the port, and returns it. 'port' is the device file path to
                // the pseudo-serialport, e.g. '/dev/tty.usb-123456'
                    var id = port; //TODO - I don't think we need this?
                    if (!pool[id]) {
                        try {
                            var rfxtrx = new rfxcom.RfxCom(port, options || {});
                            rfxtrx.ready = false;
                            rfxtrx.initialise(function (error, response, sequenceNumber) {
                                rfxtrx.ready = true;
                                rfxtrx.transmitters = {};
                                console.log("Device initialised");
                            });
                            rfxtrx.on("status", function (status) {
                                rfxtrx.receiverType = status.receiverType;
                                rfxtrx.firmwareVersion = status.firmwareVersion;
                                rfxtrx.enabledProtocols = status.enabledProtocols;
                            });
                            pool[id] = {rfxtrx: rfxtrx, refcount: 0};
                        }
                        catch (exception) {
                            console.log("bad serial port");
                            return null;
                        }
                    }
                    // Maintain a reference count for each RfxCom object
                    pool[id].refcount = pool[id].refcount + 1;
                    return pool[id].rfxtrx;
                },
            release: function (port) {
                // Decrement the reference count, and delete the RfxCom object if the count goes to 0
                    if (pool[port]) {
                        pool[port].refcount = pool[port].refcount - 1;
                        if (pool[port].refcount <= 0) {
                            delete pool[port];
                        }
                    }
                }
        }
    } ();

var releasePort = function (node) {
        // Decrement the reference count on the node port
        if (node.rfxtrxPort) {
            rfxcomPool.release(node.rfxtrxPort.port);
        }
    };

// Utility function: normalises the accepted representations of 'unit addresses' to be
// an integer, and ensures all variants of the 'group address' are converted to 0
var parseUnitAddress = function (str) {
        if (str == undefined || /all|group|\+/i.test(str)) {
            return 0;
        } else {
            return Math.round(Number(str));
        }
    };

// Flag values for the different types of message packet recognised by the nodes in this file
// By convention, the all-uppercase equivalent of the node-rfxcom object implementing the
// message packet type. The numeric values are the protocol codes used by the RFXCOM API,
// though this is also an arbitrary choice
var txTypeNumber = { LIGHTING1: 0x10, LIGHTING2: 0x11, LIGHTING5: 0x14, CURTAIN1: 0x18};

// This function takes a protocol name and returns the subtype number (defined by the RFXCOM
// API) for that protocol. It also creates the node-rfxcom object implementing the message packet type
// corresponding to that subtype, or re-uses a pre-existing object that implements it. These objects
// are stored in the transmitters property of rfxcomObject
var getRfxcomSubtype = function (rfxcomObject, protocolName) {
        var subtype;
        if (rfxcomObject.transmitters.hasOwnProperty(protocolName) === false) {
            if ((subtype = rfxcom.lighting1[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.Lighting1(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING1
                };
            } else if ((subtype = rfxcom.lighting2[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.Lighting2(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING2
                };
            } else if ((subtype = rfxcom.lighting5[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.Lighting5(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING5
                };
            } else {
                throw new Error("Protocol type '" + protocolName + "' not supported");
            }
        } else {
            subtype = rfxcomObject.transmitters[protocolName].tx.subtype;
        }
        return subtype;
    };

// An output node for sending messages to light switches & dimmers (including most types of plug-in switch)
function RfxLightsNode(n) {
    RED.nodes.createNode(this, n);
    this.port = n.port;
    this.topicSource = n.topicSource;
    this.topic = n.topic;
    this.rfxtrxPort = RED.nodes.getNode(this.port);

    var node = this;

    // Parse a string to obtain the normalised representation of the 'level' associated with a dimming
    // command. The result is either an integer in the range levelRange[0]..levelRange[1], '+' (meaning increase
    // the brightness level), or '-' (meaning reduce it). A numeric value should be in the range 0..1, or
    // equivalently in the range 0%..100%
    // Called from parseCommand
    var parseDimLevel = function (str, levelRange) {
        // An empty level range means accept Dim/Bright or Dim-/Dim+ commands only
        if (levelRange.length === 0) {
            if (/dim *\+/i.test(str)) { // 'dim+' means 'bright'
                return "+";
            } else if (/dim/i.test(str)) {
                return "-";
            } else if (/bright/i.test(str)) {
                return "+";
            }
        }
        if (/[0-9]+/.test(str) === false) {
            if (/\+/.test(str)) {
                return "+";
            } else if (/-/.test(str)) {
                return "-";
            }
        }
        var value = parseFloat(/[0-9]+(\.[0-9]*)?/.exec(str)[0]);
        if (str.match(/[0-9] *%/)) {
            value = value / 100;
        }
        value = Math.max(0, Math.min(1, value));
        if (levelRange == undefined) {
            return NaN;
        } else {
            return Math.round(levelRange[0] + value * (levelRange[1] - levelRange[0]));
        }
    };

    // Parses msg.payload looking for lighting command messages, calling the corresponding function in the
    // node-rfxcom API to implement it. All parameter checking is delegated to this API. If no valid command is
    // recognised, does nothing (quietly).
    var parseCommand = function (protocolName, address, str, levelRange) {
        var level;
        try {
            if (/on/i.test(str) || str == 1) {
                node.rfxtrx.transmitters[protocolName].tx.switchOn(address);
            } else if (/off/i.test(str) || str == 0) {
                node.rfxtrx.transmitters[protocolName].tx.switchOff(address);
            } else if (/dim|level|%|[0-9]\.|\.[0-9]/i.test(str)) {
                level = parseDimLevel(str, levelRange);
                if (isFinite(level)) {
                    node.rfxtrx.transmitters[protocolName].tx.setLevel(address, level);
                } else if (level === '+') {
                    node.rfxtrx.transmitters[protocolName].tx.increaseLevel(address);
                } else if (level === '-') {
                    node.rfxtrx.transmitters[protocolName].tx.decreaseLevel(address);
                }
            } else if (/mood/i.test(str)) {
                var mood = parseInt(/([0-9]+)/.exec(str));
                if (isFinite(mood)) {
                    node.rfxtrx.transmitters[protocolName].tx.setMood(address, mood);
                }
            } else if (/toggle/i.test(str)) {
                node.rfxtrx.transmitters[protocolName].tx.toggleOnOff(address);
            }
        } catch (exception) {
            if (exception.arguments !== undefined) {
                node.warn("Input '" + str + "': generated command '" + exception.arguments[0] + "' not supported by device");
            } else {
                node.warn(exception);
            }
        }
    };

    if (node.rfxtrxPort) {
        node.rfxtrx = rfxcomPool.get(node.rfxtrxPort.port, {debug: true});
        node.on("close", function () { releasePort(node); });
        node.on("input", function(msg) {
            // Get the device address from the node topic, or the message topic if the node topic is undefined;
            // parse the device command from the message payload; and send the appropriate command to the address
                var path, protocolName, subtype, deviceAddress, unitAddress;
                if (node.topicSource == "node" && node.topic !== undefined) {
                    path = node.topic;
                } else if (msg.topic !== undefined) {
                    path = msg.topic;
                } else {
                    node.warn("rfx-lights: missing topic");
                    return;
                }
                // Split the path to get the components of the address (remove empty components)
                path = path.split('/').filter(function (str) { return str !== ""; });
                protocolName = path[0].trim().replace(/ +/g, '_').toUpperCase();
                deviceAddress = path[1];
                unitAddress = parseUnitAddress(path[2]);
                // The subtype is needed because subtypes within the same protocol may have different dim level ranges
                subtype = getRfxcomSubtype(node.rfxtrx, protocolName);
                switch (node.rfxtrx.transmitters[protocolName].type) {
                    case txTypeNumber.LIGHTING1 :
                        parseCommand(protocolName, [deviceAddress, unitAddress], msg.payload, []);
                        break;

                    case txTypeNumber.LIGHTING2 :
                    case txTypeNumber.LIGHTING5 :
                        parseCommand(protocolName, [deviceAddress, unitAddress], msg.payload, [0, 15]);
                        break;
                }
            });
    } else {
        node.error("missing config: rfxtrx-port");
    }
}

RED.nodes.registerType("rfx-lights", RfxLightsNode);
