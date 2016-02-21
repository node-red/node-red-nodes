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

    function Beacon(n){
        RED.nodes.createNode(this,n);
        var node = this;
        node.power = n.power;
        node.period = n.period;
        node.url = n.url;

        node.options = {
            txPowerLevel: node.power,
            tlmPeriod: node.period,
            tlmCount: 2
        }


        if (node.url) {
            try {
                eddystoneBeacon.advertiseUrl(node.url, node.options);
            } catch(e){
                node.error('Error setting beacon URL', e);
            }
        }

        node.on('input', function(msg){
            try {
                eddystoneBeacon.advertiseUrl(msg.payload, node.options);
            } catch(e){
                node.error('error updating beacon URL', e);
            }
        });

        node.on('close', function(done){
            try {
                eddystoneBeacon.stop();
                done();
            } catch(e){
                node.error('error shuttingdown beacon', e);
            }
        });

    }
    RED.nodes.registerType("PhysicalWeb out", Beacon);

    function Scanner(n){
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

        node.on('close',function(done){
            EddystoneBeaconScanner.removeListener('found', onFound);
            EddystoneBeaconScanner.removeListener('updated', onFound);
            done();
        });
    }
    RED.nodes.registerType("PhysicalWeb in", Scanner);

};
