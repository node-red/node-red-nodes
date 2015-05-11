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

// Require main module
var RED = require(process.env.NODE_RED_HOME+"/red/red");
var SensorTag = require('sensortag');

// The main node definition - most things happen in here
function sensorTagNode(n) {
    RED.nodes.createNode(this,n);
    this.name = n.name;
    this.topic = n.topic;
    this.uuid = n.uuid;
    this.temperature = n.temperature;
    this.pressure = n.pressure;
    this.humidity = n.humidity;
    this.accelerometer = n.accelerometer;
    this.magnetometer = n.magnetometer;
    this.gyroscope = n.gyroscope;
    this.keys = n.keys;

    if (this.uuid === "") {
        this.uuid = undefined;
    }
    //console.log(this.uuid);

    var node=this;

    if ( typeof node.stag == "undefined") {
        //console.log("starting");
        SensorTag.discover(function(sensorTag) {
        node.stag = sensorTag;
        sensorTag.connect(function() {
            //console.log("connected");
            sensorTag.discoverServicesAndCharacteristics(function() {
                sensorTag.enableIrTemperature(function() {});
                sensorTag.on('irTemperatureChange',
                function(objectTemperature, ambientTemperature) {
                    var msg = {'topic': node.topic + '/temperature'};
                    msg.payload = {'object': objectTemperature.toFixed(1),
                    'ambient':ambientTemperature.toFixed(1)
                    };
                    node.send(msg);
                });
                sensorTag.enableBarometricPressure(function() {});
                sensorTag.on('barometricPressureChange', function(pressure) {
                    var msg = {'topic': node.topic + '/pressure'};
                    msg.payload = {'pres': pressure.toFixed(1)};
                    node.send(msg);
                });
                sensorTag.enableHumidity(function() {});
                sensorTag.on('humidityChange', function(temp, humidity) {
                    var msg = {'topic': node.topic + '/humidity'};
                    msg.payload = {'temp': temp.toFixed(1),
                    'humidity': humidity.toFixed(1)
                    };
                    node.send(msg);
                });
                sensorTag.enableAccelerometer(function() {});
                sensorTag.on('accelerometerChange', function(x,y,z) {
                    var msg = {'topic': node.topic + '/accelerometer'};
                    msg.payload = {'x': x, 'y': y, 'z': z};
                    node.send(msg);
                });
                sensorTag.enableMagnetometer(function() {});
                sensorTag.on('magnetometerChange', function(x,y,z) {
                    var msg = {'topic': node.topic + '/magnetometer'};
                    msg.payload = {'x': x, 'y': y, 'z': z};
                    node.send(msg);
                });
                sensorTag.enableGyroscope(function() {});
                sensorTag.on('gyroscopeChange', function(x,y,z) {
                    var msg = {'topic': node.topic + '/gyroscope'};
                    msg.payload = {'x': x, 'y': y, 'z': z};
                    node.send(msg);
                });
                sensorTag.on('simpleKeyChange', function(left, right) {
                    var msg = {'topic': node.topic + '/keys'};
                    msg.payload = {'left': left, 'right': right};
                    node.send(msg);
                });
                enable(node);
            });
        });
    },node.uuid);
    } else {
        //console.log("reconfig");
        enable(node);
    }
}

function enable(node) {
    if (node.temperature) {
        node.stag.notifyIrTemperature(function() {});
    } else {
        node.stag.unnotifyIrTemperature(function() {});
    }
    if (node.pressure) {
        node.stag.notifyBarometricPressure(function() {});
    } else {
        node.stag.unnotifyBarometricPressure(function() {});
    }
    if (node.humidity) {
        node.stag.notifyHumidity(function() {});
    } else {
        node.stag.unnotifyHumidity(function() {});
    }
    if (node.accelerometer) {
        node.stag.notifyAccelerometer(function() {});
    } else {
        node.stag.unnotifyAccelerometer(function() {});
    }
    if (node.magnetometer) {
        node.stag.notifyMagnetometer(function() {});
    } else {
        node.stag.unnotifyMagnetometer(function() {});
    }
    if (node.gyroscope) {
        node.stag.notifyGyroscope(function() {});
    } else {
        node.stag.unnotifyGyroscope(function() {});
    }
    if (node.keys) {
        node.stag.notifySimpleKey(function() {});
    } else {
        node.stag.unnotifySimpleKey(function() {});
    }
}
RED.nodes.registerType("sensorTag",sensorTagNode);
