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

    var checkLength = function(text) {
        var l = text.length;
        switch(true) {
            case /^http:\/\/www./.test(text):
            l -= 10;
            break;
            case /^https:\/\/www./.test(text):
            l -= 11;
            break;
            case /^http:\/\//.test(text):
            l -= 6;
            break;
            case /^https:\/\//.test(text):
            l -= 7;
            break;
        }

        switch(true) {
            case /.*\.info\/.*/.test(text):
            l -= 5;
            break;
            case /.*\.com\/.*/.test(text):
            case /.*\.net\/.*/.test(text):
            case /.*\.org\/.*/.test(text):
            case /.*\.edu\/.*/.test(text):
            case /.*\.biz\/.*/.test(text):
            case /.*\.gov\/.*/.test(text):
            case /.*\.info.*/.test(text):
            l -= 4;
            break;
            case /.*\.com.*/.test(text):
            case /.*\.net.*/.test(text):
            case /.*\.org.*/.test(text):
            case /.*\.edu.*/.test(text):
            case /.*\.biz.*/.test(text):
            case /.*\.gov.*/.test(text):
            l -= 3;
            break;
        }
        return l;
    }

    function Beacon(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.mode = n.mode;
        node.power = n.power;
        node.period = n.period;
        node.count = n.count;
        node.url = n.url;
        node.namespace = n.namespace;
        node.instance = n.instance;

        node.options = {
            txPowerLevel: node.power,
            tlmPeriod: node.period,
            tlmCount: node.count
        };

        if (node.mode === "url" && node.url) {
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

        if (node.mode === "uid") {
            if (!eddyBeacon) {
                eddyBeacon = true;
                try {
                    eddystoneBeacon.advertiseUid(node.namespace, node.instance, node.options);
                    node.status({fill:"green",shape:"dot",text:node.namespace});
                } catch(e) {
                    node.error('Error setting beacon information', e);
                }
            }
            else {node.warn('Beacon already in use');}
        }

        node.on('input', function(msg) {
            if (msg.advertising === false) {
                if (eddyBeacon) {
                    try {
                        eddystoneBeacon.stop();
                        node.status({fill:"red",shape:"dot",text:"Stopped"});
                    } catch(e) {
                        node.error('error shutting down beacon', e);
                    }
                    return;
                }
            }
            if (msg.advertising === true) {
                if (node.mode === "url") {
                    try {
                        eddystoneBeacon.advertiseUrl(node.url, node.options);
                        node.status({fill:"green",shape:"dot",text:node.url});
                    } catch(e) {
                        node.error('Error setting beacon URL', e);
                    }
                    return;
                }
                if (node.mode === "uid") {
                    try {
                        eddystoneBeacon.advertiseUid(node.namespace, node.instance, node.options);
                        node.status({fill:"green",shape:"dot",text:node.namespace});
                    } catch(e) {
                        node.error('Error setting beacon information', e);
                    }
                    return;
                }
            }
            // url mode
            if (node.mode === "url") {
              if (checkLength(msg.payload) <= 18) {
                  try {
                      node.url = msg.payload;
                      eddystoneBeacon.advertiseUrl(node.url, node.options);
                      node.status({fill:"green",shape:"dot",text:node.url});
                  } catch(e) {
                      node.status({fill:"red",shape:"dot",text:"Error setting URL"});
                      node.error('error updating beacon URL', e);
                  }
              } else {
                  node.status({fill:"red",shape:"dot",text:"URL too long"});
              }
            }
            // uid mode
            else {
              try {
                  node.namespace = msg.payload;
                  node.instance = msg.topic;
                  eddystoneBeacon.advertiseUid(node.namespace, node.instance, node.options);
                  node.status({fill:"green",shape:"dot",text:msg.payload});
              } catch(e) {
                  node.status({fill:"red",shape:"dot",text:"Error setting beacon information"});
                  node.error('Error setting beacon information', e);
              }
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
        node.duplicates = n.duplicates;

        function onFound(beacon) {
            node.send({topic: node.topic || 'found', payload: beacon});
        }

        function onUpdated(beacon) {
            node.send({topic: node.topic || 'updated', payload: beacon});
        }

        function onLost(beacon) {
            node.send({topic: node.topic || 'lost', payload: beacon});
        }

        EddystoneBeaconScanner.on('found', onFound);
        EddystoneBeaconScanner.on('updated', onUpdated);
        EddystoneBeaconScanner.on('lost', onLost);

        node.on('close',function(done) {
            EddystoneBeaconScanner.removeListener('found', onFound);
            EddystoneBeaconScanner.removeListener('updated', onUpdated);
            EddystoneBeaconScanner.removeListener('lost', onLost);
            done();
        });

        var tout = setTimeout(function() {
            EddystoneBeaconScanner.startScanning(node.duplicates);
        }, 2000);


        node.on("close", function(done) {
            if (tout) { clearTimeout(tout); }
            EddystoneBeaconScanner.stopScanning();
            done();
        });
    }
    RED.nodes.registerType("PhysicalWeb in", Scanner);
};
