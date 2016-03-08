/**
 * Copyright 2015 IBM Corp.
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
    var eddystoneBeacon = require('eddystone-beacon');
    var EddystoneBeaconScanner = require('eddystone-beacon-scanner');
    var eddyBeacon = false;

    function Beacon(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.power = n.power;
        node.period = n.period * 10;
        node.url = n.url;

        node.options = {
            txPowerLevel: node.power,
            tlmPeriod: node.period,
            tlmCount: 2
        };

        if (node.url) {
            if (!eddyBeacon) {
                eddyBeacon = true;
                try {
                    eddystoneBeacon.advertiseUrl(node.url, node.options);
                    node.status({fill:"green",shape:"dot",text:node.url});
                } catch(e) {
                    node.error('Error setting beacon URL', e);
                }
            }
            else {node.warn('Beacon already in use');}
        }

        node.on('input', function(msg) {
            try {
                eddystoneBeacon.advertiseUrl(msg.payload, node.options);
                node.status({fill:"green",shape:"dot",text:node.url.toString()});
            } catch(e) {
                node.status({fill:"red",shape:"circle",text:"URL too long"});
                node.error('error updating beacon URL', e);
            }
        });

        node.on('close', function(done) {
            eddyBeacon = false;
            try {
                node.status({});
                eddystoneBeacon.stop();
                done();
            } catch(e) {
                node.error('error shutting down beacon', e);
            }
        });

    }
    RED.nodes.registerType("PhysicalWeb out", Beacon);

    function Scanner(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.topic = n.topic;

        function onFound(beacon) {
            node.send({
                topic: node.topic,
                payload: beacon
            });
        }

        EddystoneBeaconScanner.on('found', onFound);
        EddystoneBeaconScanner.on('updated', onFound);

        node.on('close',function(done) {
            EddystoneBeaconScanner.removeListener('found', onFound);
            EddystoneBeaconScanner.removeListener('updated', onFound);
            done();
        });

        var tout = setTimeout(function() {
            EddystoneBeaconScanner.startScanning(true);
        },2000);


        node.on("close", function(done) {
            if (tout) { clearTimeout(tout); }
            EddystoneBeaconScanner.stopScanning();
            done();
        });
    }
    RED.nodes.registerType("PhysicalWeb in", Scanner);
};
