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

// The config node holding the (serial) port device path for one or more
// rfxtrx-tx & rfxtrx-rx nodes
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
                    var id = port; //TODO - I don't think we need this?
                    if (!pool[id]) {
                        try {
                            var rfxtrx = new rfxcom.RfxCom(port, options || {});
                            //var rfxtrx = new rfxcom.RfxCom(port, {debug: true});
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
                    pool[id].refcount = pool[id].refcount + 1;
                    return pool[id].rfxtrx;
                },
            release: function (port) {
                    if (pool[port]) {
                        pool[port].refcount = pool[port].refcount - 1;
                        if (pool[port].refcount <= 0) {
                            delete pool[port];
                        }
                    }
                }
        }
    } ();

var txTypes = { LIGHTING1: 1, LIGHTING2: 2, LIGHTING5: 3, CURTAIN1: 4};

var parseDimLevel = function (str, levelRange) {
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

var parseUnitAddress = function (str) {
    if (str == undefined || /all|group|\+/i.test(str)) {
        return 0;
    } else {
        return Math.round(Number(str));
    }
};

function RfxTxNode(n) {
    RED.nodes.createNode(this,n);
    this.port = n.port;
    this.rfxtrxPort = RED.nodes.getNode(this.port);

    var parseCommand = function (txType, deviceID, msg, levelRange) {
        var level;
        try {
            if (/on/i.test(msg.payload) || msg.payload == 1) {
                node.rfxtrx.transmitters[txType].tx.switchOn(deviceID);
            } else if (/off/i.test(msg.payload) || msg.payload == 0) {
                node.rfxtrx.transmitters[txType].tx.switchOff(deviceID);
            } else if (/dim|level|%|[0-9]\.|\.[0-9]/i.test(msg.payload)) {
                level = parseDimLevel(msg.payload, levelRange);
                if (isFinite(level)) {
                    node.rfxtrx.transmitters[txType].tx.setLevel(deviceID, level);
                } else if (level === '+') {
                    node.rfxtrx.transmitters[txType].tx.inreaseLevel(deviceID);
                } else if (level === '-') {
                    node.rfxtrx.transmitters[txType].tx.decreaseLevel(deviceID);

                }
            } else if (/mood/i.test(msg.payload)) {
                var mood = parseInt(/([0-9]+)/.exec(msg.payload));
                if (isFinite(mood)) {
                    node.rfxtrx.transmitters[txType].tx.setMood(deviceID, mood);
                }
            } else if (/toggle/i.test(msg.payload)) {
                node.rfxtrx.transmitters[txType].tx.toggleOnOff(deviceID);
            }
        } catch (exception) {
            node.warn("Command '" + exception.arguments[0] + "' not supported by device")
        }
    };

    if (this.rfxtrxPort) {
        var node = this;
        node.rfxtrx = rfxcomPool.get(this.rfxtrxPort.port, {debug: true});
        
        node.on("input", function(msg) {
                if (msg.topic === undefined) {
                    node.error("rfxtrx-tx: missing topic");
                    return;
                }
            // Split the topic to get the components of the address (remove empty components)
                var path = msg.topic.split('/').filter(function (str) { return str !== ""; });
            // See if the topic subtype (first path component) already has a transmitter,
            // if not, create one
                var subtype,
                    txType = path[0].trim().replace(/ +/g, '_').toUpperCase();
                if (node.rfxtrx.transmitters.hasOwnProperty(txType) === false) {
                    if ((subtype = rfxcom.lighting1[txType]) !== undefined) {
                        node.rfxtrx.transmitters[txType] = {
                            tx: new rfxcom.Lighting1(node.rfxtrx, subtype),
                            type: txTypes.LIGHTING1
                        };
                    } else if ((subtype = rfxcom.lighting2[txType]) !== undefined) {
                        node.rfxtrx.transmitters[txType] = {
                            tx: new rfxcom.Lighting2(node.rfxtrx, subtype),
                            type: txTypes.LIGHTING2
                        };
                    } else if ((subtype = rfxcom.lighting5[txType]) !== undefined) {
                        node.rfxtrx.transmitters[txType] = {
                            tx: new rfxcom.Lighting5(node.rfxtrx, subtype),
                            type: txTypes.LIGHTING5
                        };
                    } else {
                        node.error("rfxtrx: transmission type '" + txType + "' not supported");
                        return;
                    }
                } else {
                    subtype = node.rfxtrx.transmitters[txType].tx.subtype;
                }
                var address = parseUnitAddress(path[2]);
                switch (node.rfxtrx.transmitters[txType].type) {
                case txTypes.LIGHTING1 :
                    // expect X10|ARC|ELRO|WAVEMAN|CHACON|IMPULS|RISING_SUN|PHILIPS_SBC|ENERGENIE_ENER010|ENERGENIE_5_GANG|COCO /
                    //         [A-P] / [1-16]|GROUP|ALL|+|0
                    if (address >= 0) {
                        if (((subtype == 0 || subtype == 1 || subtype == 3) && address <= 16) ||
                            ((subtype == 2  || subtype == 5) && address <= 64) ||
                            (subtype == 7 && address <= 8) ||
                            (subtype == 9 && address <= 10) ||
                            ((subtype == 4 || subtype == 6 || subtype == 8 || subtype == 11) && address <= 4)) {
                            parseCommand(txType, [path[1], address], msg, [1, 2])
                        }
                    } else {
                        node.warn("rfxtrx-tx: Invalid address '" + path[2] + "' for device type " + path[0]);
                    }
                    break;

                case txTypes.LIGHTING2 :
                    // expect AC|HOMEEASY_EU|ANSLUT / 0x00123456|00123456 / [1-16]|GROUP|ALL|+|0
                    if (address >= 0  && address <= 16) {
                         parseCommand(txType, [path[1], address], msg, [0, 15])
                    } else {
                        node.warn("rfxtrx-tx: Invalid address '" + path[2] + "' for device type " + path[0]);
                    }
                    break;

                case txTypes.LIGHTING5 :
                    if (address >= 0) {
                        if (((subtype == 0 || subtype == 4) && address <= 16) ||
                            (subtype == 1 && address <= 4) ||
                            (subtype == 2 && address <= 6) ||
                            ((subtype == 3 || subtype == 5 || subtype == 6) && address == 0)) {
                            parseCommand(txType, [path[1], address], msg, [0, 15])
                        }
                    } else {
                        node.warn("rfxtrx-tx: Invalid address '" + path[2] + "' for device type " + path[0]);
                    }
                    break;
                }
            });
    } else {
        this.error("missing config: rfxtrx-port");
    }

    this.on("close", function() {
        if (this.rfxtrxPort) {
            rfxcomPool.release(this.rfxtrxPort.port);
        }
    });
}

RED.nodes.registerType("rfxtrx-tx", RfxTxNode);
