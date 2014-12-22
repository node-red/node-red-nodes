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
                            //noinspection JSUnusedLocalSymbols
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
                            console.log("[43-rfxcom.js] " + exception.message);
                        //    return null;
                            pool[id] = {rfxtrx: null, refcount: 0};
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
var txTypeNumber = { LIGHTING1: 0x10, LIGHTING2: 0x11, LIGHTING3: 0x12, LIGHTING5: 0x14, LIGHTING6: 0x15, CURTAIN1: 0x18};

// This function takes a protocol name and returns the subtype number (defined by the RFXCOM
// API) for that protocol. It also creates the node-rfxcom object implementing the message packet type
// corresponding to that subtype, or re-uses a pre-existing object that implements it. These objects
// are stored in the transmitters property of rfxcomObject
var getRfxcomSubtype = function (rfxcomObject, protocolName) {
        var subtype;
        if (rfxcomObject.transmitters.hasOwnProperty(protocolName) === false) {
            if ((subtype = rfxcom.lighting1[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.lighting1.transmitter(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING1
                };
            } else if ((subtype = rfxcom.lighting2[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.lighting2.transmitter(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING2
                };
            } else if ((subtype = rfxcom.lighting3[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.lighting3.transmitter(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING3
                };
            } else if ((subtype = rfxcom.lighting5[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.lighting5.transmitter(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING5
                };
            } else if ((subtype = rfxcom.lighting6[protocolName]) !== undefined) {
                rfxcomObject.transmitters[protocolName] = {
                    tx: new rfxcom.lighting6.transmitter(rfxcomObject, subtype),
                    type: txTypeNumber.LIGHTING6
                };
            } else {
                throw new Error("Protocol type '" + protocolName + "' not supported");
            }
        } else {
            subtype = rfxcomObject.transmitters[protocolName].tx.subtype;
        }
        return subtype;
    };

// Convert a string - the rawTopic - into a normalised form (an Array) so that checkTopic() can easily compare
// a topic against a pattern
var normaliseTopic = function (rawTopic) {
        var parts;
        if (rawTopic == undefined || typeof rawTopic !== "string") {
                return [];
        }
        parts = rawTopic.split("/");
        if (parts.length >= 1) {
            parts[0] = parts[0].trim().replace(/ +/g, '_').toUpperCase();
        }
        if (parts.length >= 2) {
            // handle housecodes > "F" as a special case (X10, ARC)
            if (isNaN(parts[1])) {
                parts[1] = parseInt(parts[1].trim(), 36);
            } else {
                parts[1] = parseInt(parts[1].trim(), 16);
            }
        }
        if (parts.length >= 3) {
            if (/0|all|group|\+/i.test(parts[2])) {
                return parts.slice(0, 1);
            }
            // handle Blyss groupcodes as a special case
            if (isNaN(parts[2])) {
                parts[2] = parseInt(parts[2].trim(), 36);
            } else {
                parts[2] = parseInt(parts[2].trim(), 10);
            }
        }
        if (parts.length >= 4) {
            if (/0|all|group|\+/i.test(parts[3])) {
                return parts.slice(0, 2);
            }
            parts[3] = parseInt(parts[3].trim(), 10);
        }
    // The return is always [ string, number, number, number ] - all parts optional
        return parts;
    };

// Check if the supplied topic starts with the given pattern (both being normalised topics)
var checkTopic = function (topic, pattern) {
        var parts, i;
        parts = normaliseTopic(topic);
        for (i = 0; i < pattern.length; i++) {
            if (parts[i] !== pattern[i]) {
                return false;
            }
        }
        return true;
    };

// An input node for listening to messages from lighting remote controls
function RfxLightsInNode(n) {
    RED.nodes.createNode(this, n);
    this.port = n.port;
    this.topicSource = n.topicSource;
    this.topic = normaliseTopic(n.topic);
    this.name = n.name;
    this.rfxtrxPort = RED.nodes.getNode(this.port);

    var node = this;
    if (node.rfxtrxPort) {
        node.rfxtrx = rfxcomPool.get(node.rfxtrxPort.port, {debug: true});
        if (node.rfxtrx !== null) {
            node.rfxtrx.on("lighting1", function (evt) {
                var msg = {};
                msg.topic = evt.subtype + "/" + evt.housecode;
                if (evt.commandNumber === 5 || evt.commandNumber === 6) {
                    msg.topic = msg.topic + "/+";
                } else {
                    msg.topic = msg.topic + "/" + evt.unitcode;
                }
                if (node.topicSource === "all" || checkTopic(msg.topic, node.topic)) {
                    switch (evt.commandNumber) {
                        case 0 :
                        case 5 :
                            msg.payload = "Off";
                            break;

                        case 1 :
                        case 6 :
                            msg.payload = "On";
                            break;

                        case 2 :
                            msg.payload = "Dim";
                            break;

                        case 3 :
                            msg.payload = "Bright";
                            break;

                        case 7 :    // The ARC 'Chime' command - handled in rfx-doorbells so ignore it here
                            return;

                        default:
                            node.warn("rfx-lights-in: unrecognised Lighting1 command " + evt.commandNumber.toString(16));
                            return;
                    }
                    node.send(msg);
                }
            });

            node.rfxtrx.on("lighting2", function (evt) {
                var msg = {};
                msg.topic = evt.subtype + "/" + evt.id;
                if (evt.commandNumber > 2) {
                    msg.topic = msg.topic + "/+";
                } else {
                    msg.topic = msg.topic + "/" + evt.unitcode;
                }
                if (node.topicSource === "all" || checkTopic(msg.topic, node.topic)) {
                    switch (evt.commandNumber) {
                        case 0:
                        case 3:
                            msg.payload = "Off";
                            break;

                        case 1:
                        case 4:
                            msg.payload = "On";
                            break;

                        case 2:
                        case 5:
                            msg.payload = "Dim " + evt.level/15*100 + "%";
                            break;

                        default:
                            node.warn("rfx-lights-in: unrecognised Lighting2 command " + evt.commandNumber.toString(16));
                            return;
                    }
                    node.send(msg);
                }
            });

            node.rfxtrx.on("lighting5", function (evt) {
                var msg = {};
                msg.topic = evt.subtype + "/" + evt.id;
                if ((evt.commandNumber == 2 && (evt.subtype == 0 || evt.subtype == 2 || evt.subtype == 4) ) ||
                    (evt.commandNumber == 3) && (evt.subtype == 2 || evt.subtype == 4)) {
                    msg.topic = msg.topic + "/+";
                } else {
                    msg.topic = msg.topic + "/" + evt.unitcode;
                }
                if (node.topicSource === "all" || checkTopic(msg.topic, node.topic)) {
                    switch (evt.subtype) {
                        case 0: // Lightwave RF
                            switch (evt.commandNumber) {
                                case 0:
                                case 2:
                                    msg.payload = "Off";
                                    break;

                                case 1:
                                    msg.payload = "On";
                                    break;

                                case 3:
                                case 4:
                                case 5:
                                case 6:
                                case 7:
                                    msg.payload = "Mood " + evt.commandNumber - 2;
                                    break;

                                case 16:
                                    msg.payload = "Dim " + evt.level/31*100 + "%";
                                    break;

                                case 17:
                                case 18:
                                case 19:
                                    node.warn("Lighting5: LightwaveRF colour commands not implemented");
                                    break;

                                default:
                                    return;
                            }
                            break;

                        case 2:
                        case 4: // BBSB & CONRAD
                            switch (evt.commandNumber) {
                                case 0:
                                case 2:
                                    msg.payload = "Off";
                                    break;

                                case 1:
                                case 3:
                                    msg.payload = "On";
                                    break;

                                default:
                                    return;
                            }
                            break;

                        case 6: // TRC02
                            switch (evt.commandNumber) {
                                case 0:
                                    msg.payload = "Off";
                                    break;

                                case 1:
                                    msg.payload = "On";
                                    break;

                                case 2:
                                    msg.payload = "Bright";
                                    break;

                                case 3:
                                    msg.payload = "Dim";
                                    break;

                                default:
                                    node.warn("Lighting5: TRC02 colour commands not implemented");
                                    return;
                            }
                            break;
                    }
                    node.send(msg);
                }
            });

            node.rfxtrx.on("lighting6", function (evt) {
                var msg = {};
                msg.topic = evt.subtype + "/" + evt.id + "/" + evt.groupcode;
                if (evt.commandNumber > 1) {
                    msg.topic = msg.topic + "/+";
                } else {
                    msg.topic = msg.topic + "/" + evt.unitcode;
                }
                if (node.topicSource === "all" || checkTopic(msg.topic, node.topic)) {
                    switch (evt.commandNumber) {
                        case 1:
                        case 3:
                            msg.payload = "Off";
                            break;

                        case 0:
                        case 2:
                            msg.payload = "On";
                            break;

                        default:
                            node.warn("rfx-lights-in: unrecognised Lighting6 command " + evt.commandNumber.toString(16));
                            return;
                    }
                    node.send(msg);
                }
            });
        }
    } else {
        node.error("missing config: rfxtrx-port");
    }
}

RED.nodes.registerType("rfx-lights-in", RfxLightsInNode);

// Remove the message event handlers on close
RfxLightsInNode.prototype.close = function () {
    if (this.rfxtrx !== null) {
        this.rfxtrx.removeAllListeners("lighting1");
        this.rfxtrx.removeAllListeners("lighting2");
        this.rfxtrx.removeAllListeners("lighting5");
        this.rfxtrx.removeAllListeners("lighting6");
    }
};

// An input node for listening to messages from (mainly weather) sensors
function RfxWeatherSensorNode(n) {
    RED.nodes.createNode(this, n);
    this.port = n.port;
    this.topicSource = n.topicSource;
    this.topic = normaliseTopic(n.topic);
    this.name = n.name;
    this.rfxtrxPort = RED.nodes.getNode(this.port);

    var node = this;
    var i;

    var weatherEventHandler = function (evt) {
            var msg = {};
            msg.topic = evt.subtype + "/" + evt.id;
            if (node.topicSource === "all" || checkTopic(msg.topic, node.topic)) {
                msg.payload = { status: { rssi: evt.rssi } };
                if (evt.hasOwnProperty("temperature")) {
                    msg.payload.temperature = { value: evt.temperature, unit: "degC" };
                }
                if (evt.hasOwnProperty("barometer")) {
                    msg.payload.pressure = { value: evt.barometer, unit: "hPa" };
                }
                if (evt.hasOwnProperty("direction")) {
                    msg.payload.wind = { direction: { value: evt.direction, unit: "degrees" } };
                    if (evt.hasOwnProperty("averageSpeed")) {
                        msg.payload.wind.speed = { value: evt.averageSpeed, unit: "m/s" };
                        msg.payload.wind.gust = { value: evt.gustSpeed, unit: "m/s" };
                    } else {
                        msg.payload.wind.speed = { value: evt.gustSpeed, unit: "m/s" };
                    }
                    if (evt.hasOwnProperty("chillfactor")) {
                        msg.payload.wind.chillfactor = { value: evt.chillfactor, unit: "degC" };
                    }
                }
                if (evt.hasOwnProperty("humidity")) {
                    msg.payload.humidity = { value: evt.humidity, unit: "%", status: rfxcom.humidity[evt.humidityStatus] };
                }
                if (evt.hasOwnProperty("rainfall")) {
                    msg.payload.rainfall = { total: { value: evt.rainfall, unit: "mm" } };
                    if (evt.hasOwnProperty("rainfallRate")) {
                        msg.payload.rainfall.rate = { value: evt.rainfallRate, unit: "mm/hr" };
                    }
                } else if (evt.hasOwnProperty("rainfallIncrement")) {
                    msg.payload.rainfall = { increment: { value: evt.rainfallIncrement, unit: "mm" } };
                }
                if (evt.hasOwnProperty("uv")) {
                    msg.payload.uv = { value: evt.uv, unit: "UVIndex" };
                }
                if (evt.hasOwnProperty("forecast")) {
                    msg.payload.forecast = rfxcom.forecast[evt.forecast];
                }
                if (evt.hasOwnProperty("batteryLevel")) {
                    msg.payload.status.battery = evt.batteryLevel;
                }
                node.send(msg);
            }
        };

    if (node.rfxtrxPort) {
        node.rfxtrx = rfxcomPool.get(node.rfxtrxPort.port, {debug: true});
        if (node.rfxtrx !== null) {
            for (i = 1; i < rfxcom.temperatureRain1.length; i++) {
                node.rfxtrx.on("temprain" + i, weatherEventHandler);
            }
            for (i = 1; i < rfxcom.temperature1.length; i++) {
                node.rfxtrx.on("temp" + i, weatherEventHandler);
            }
            for (i = 1; i < rfxcom.humidity1.length; i++) {
                node.rfxtrx.on("humidity" + i, weatherEventHandler);
            }
            for (i = 1; i < rfxcom.temperatureHumidity1.length; i++) {
                node.rfxtrx.on("th" + i, weatherEventHandler);
            }
            for (i = 1; i < rfxcom.tempHumBaro1.length; i++) {
                node.rfxtrx.on("thb" + i, weatherEventHandler);
            }
            for (i = 1; i < rfxcom.temperatureRain1.length; i++) {
                node.rfxtrx.on("rain" + i, weatherEventHandler);
            }
            for (i = 1; i < rfxcom.wind1.length; i++) {
                node.rfxtrx.on("wind" + i, weatherEventHandler);
            }
            for (i = 1; i < rfxcom.uv1.length; i++) {
                node.rfxtrx.on("uv" + i, weatherEventHandler);
            }
        }
    } else {
        node.error("missing config: rfxtrx-port");
    }
}

RED.nodes.registerType("rfx-sensor", RfxWeatherSensorNode);

// Remove the message event handlers on close
RfxWeatherSensorNode.prototype.close = function () {
    var i;
    if (this.rfxtrx !== null) {
        for (i = 1; i < rfxcom.temperatureRain1.length; i++) {
            this.rfxtrx.removeAllListeners("temprain" + i);
        }
        for (i = 1; i < rfxcom.temperature1.length; i++) {
            this.rfxtrx.removeAllListeners("temp" + i);
        }
        for (i = 1; i < rfxcom.humidity1.length; i++) {
            this.rfxtrx.removeAllListeners("humidity" + i);
        }
        for (i = 1; i < rfxcom.temperatureHumidity1.length; i++) {
            this.rfxtrx.removeAllListeners("th" + i);
        }
        for (i = 1; i < rfxcom.tempHumBaro1.length; i++) {
            this.rfxtrx.removeAllListeners("thb" + i);
        }
        for (i = 1; i < rfxcom.temperatureRain1.length; i++) {
            this.rfxtrx.removeAllListeners("rain" + i);
        }
        for (i = 1; i < rfxcom.wind1.length; i++) {
            this.rfxtrx.removeAllListeners("wind" + i);
        }
        for (i = 1; i < rfxcom.uv1.length; i++) {
            this.rfxtrx.removeAllListeners("uv" + i);
        }
    }
};

// An input node for listening to messages from (electrical) energy & current monitors
function RfxEnergyMeterNode(n) {
    RED.nodes.createNode(this, n);
    this.port = n.port;
    this.topicSource = n.topicSource;
    this.topic = normaliseTopic(n.topic);
    this.name = n.name;
    this.rfxtrxPort = RED.nodes.getNode(this.port);

    var node = this;

    var meterEventHandler = function (evt) {
            var msg = {};
            msg.topic = evt.subtype + "/" + evt.id;
            if (node.topicSource === "all" || checkTopic(msg.topic, node.topic)) {
                msg.payload = { status: { rssi: evt.rssi } };
                if (evt.hasOwnProperty("voltage")) {
                    msg.payload.voltage = { value: evt.voltage, unit: "V"}
                }
                if (evt.hasOwnProperty("current")) {
                    msg.payload.current = { value: evt.current, unit: "A"}
                }
                if (evt.hasOwnProperty("power")) {
                    msg.payload.power = { value: evt.power, unit: "W" }
                }
                if (evt.hasOwnProperty("energy")) {
                    msg.payload.energy = { value: evt.energy, unit: "Wh" }
                }
                if (evt.hasOwnProperty("powerFactor")) {
                    msg.payload.powerFactor = { value: evt.powerFactor, unit: "" }
                }
                if (evt.hasOwnProperty("frequency")) {
                    msg.payload.frequency = { value: evt.frequency, unit: "Hz" }
                }
                if (evt.hasOwnProperty("batteryLevel")) {
                    msg.payload.status.battery = evt.batteryLevel;
                }
                node.send(msg);
            }
        };

    if (node.rfxtrxPort) {
        node.rfxtrx = rfxcomPool.get(node.rfxtrxPort.port, {debug: true});
        if (node.rfxtrx !== null) {
            node.rfxtrx.on("elec", meterEventHandler)
        }
    } else {
        node.error("missing config: rfxtrx-port");
    }
}

RED.nodes.registerType("rfx-meter", RfxEnergyMeterNode);

// Remove the message event handler on close
RfxEnergyMeterNode.prototype.close = function () {
        if (this.rfxtrx !== null) {
            this.rfxtrx.removeAllListeners("elec");
        }
    };

// An output node for sending messages to light switches & dimmers (including most types of plug-in switch)
function RfxLightsOutNode(n) {
    RED.nodes.createNode(this, n);
    this.port = n.port;
    this.topicSource = n.topicSource;
    this.topic = n.topic;
    this.name = n.name;
    this.rfxtrxPort = RED.nodes.getNode(this.port);

    var node = this;

    // Parse a string to obtain the normalised representation of the 'level' associated with a dimming
    // command. The result is either an integer in the range levelRange[0]..levelRange[1], '+' (meaning increase
    // the brightness level), or '-' (meaning reduce it). An input numeric value should be in the range 0..1, or
    // equivalently in the range 0%..100%
    // Called from parseCommand
    var parseDimLevel = function (str, levelRange) {
        // An empty level range means accept Dim/Bright or Dim-/Dim+ commands only
        if (levelRange.length === 0 || /[0-9]+/.test(str) === false) {
            if (/dim.*\+/i.test(str)) { // 'dim+' means 'bright'
                return "+";
            } else if (/dim.*-/i.test(str)) {
                return "-";
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
        var level, mood;
        try {
            if (/on/i.test(str) || str == 1) {
                node.rfxtrx.transmitters[protocolName].tx.switchOn(address);
            } else if (/off/i.test(str) || str == 0) {
                node.rfxtrx.transmitters[protocolName].tx.switchOff(address);
            } else if (/dim|bright|level|%|[0-9]\.|\.[0-9]/i.test(str)) {
                level = parseDimLevel(str, levelRange);
                if (isFinite(level)) {
                    node.rfxtrx.transmitters[protocolName].tx.setLevel(address, level);
                } else if (level === '+') {
                    node.rfxtrx.transmitters[protocolName].tx.increaseLevel(address);
                } else if (level === '-') {
                    node.rfxtrx.transmitters[protocolName].tx.decreaseLevel(address);
                }
            } else if (/mood/i.test(str)) {
                mood = parseInt(/([0-9]+)/.exec(str));
                if (isFinite(mood)) {
                    node.rfxtrx.transmitters[protocolName].tx.setMood(address, mood);
                }
            } else if (/toggle/i.test(str)) {
                node.rfxtrx.transmitters[protocolName].tx.toggleOnOff(address);
            } else if (/program|learn/i.test(str)) {
                node.rfxtrx.transmitters[protocolName].tx.program(address);
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
                var path, protocolName, subtype, deviceAddress, unitAddress, levelRange;
                if (node.topicSource == "node" && node.topic !== undefined) {
                    path = node.topic;
                } else if (msg.topic !== undefined) {
                    path = msg.topic;
                } else {
                    node.warn("rfx-lights-out: missing topic");
                    return;
                }
                // Split the path to get the components of the address (remove empty components)
                path = path.split('/').filter(function (str) { return str !== ""; });
                protocolName = path[0].trim().replace(/ +/g, '_').toUpperCase();
                deviceAddress = path.slice(1, -1);
                unitAddress = parseUnitAddress(path.slice(-1)[0]);
                // The subtype is needed because subtypes within the same protocol might have different dim level ranges
                //noinspection JSUnusedAssignment
                try {
                    subtype = getRfxcomSubtype(node.rfxtrx, protocolName);
                    switch (node.rfxtrx.transmitters[protocolName].type) {
                        case txTypeNumber.LIGHTING1 :
                        case txTypeNumber.LIGHTING6 :
                            levelRange = [];
                            break;

                        case txTypeNumber.LIGHTING2 :
                            levelRange = [0, 15];
                            break;

                        case txTypeNumber.LIGHTING3 :
                            levelRange = [0, 10];
                            break;

                        case txTypeNumber.LIGHTING5 :
                            levelRange = [0, 31];
                            break;
                    }
                    if (levelRange !== undefined) {
                        parseCommand(protocolName, deviceAddress.concat(unitAddress), msg.payload, levelRange);
                    }
                } catch (exception) {
                    node.warn((node.name || "rfx-lights-out ") + ": serial port " + node.rfxtrxPort.port + " does not exist");
                }
            });
    } else {
        node.error("missing config: rfxtrx-port");
    }
}

RED.nodes.registerType("rfx-lights-out", RfxLightsOutNode);

