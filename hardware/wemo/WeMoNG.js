
var WeMoNG = require('./lib/wemo.js');

var wemo = new WeMoNG();

//this won't work as there is no way to stop it...
//but is that a problem?
var interval = setInterval(wemo.start.bind(wemo), 60000);
wemo.start();

module.exports = function(RED) {
    'use strict';
    var util = require('util');
    var ip = require('ip');
    var bodyParser = require('body-parser');
    var http = require('http');
    var os = require('os');

    var settings = RED.settings;

    var subscriptions = {};
    var sub2dev = {};

    var resubscribe = function() {

        var subs = Object.keys(subscriptions);
        for (var s in subs) {
            if (subs.hasOwnProperty(s)) {
                var sub = subscriptions[subs[s]];
                var dev = wemo.get(subs[s]);
                var reSubOptions = {
                    host: dev.ip,
                    port: dev.port,
                    path: dev.device.UDN.indexOf('Bridge-1_0') < 0 ? '/upnp/event/basicevent1' : '/upnp/event/bridge1',
                    method: 'SUBSCRIBE',
                    headers: {
                        'SID': sub.sid,
                        'TIMEOUT': 'Second-300'
                    }
                };

                var resub_request = http.request(reSubOptions, function(res) {
                    //shoudl raise an error if needed
                    if (res.statusCode != 200) {
                        console.log('problem with resubscription %s - %s', res.statusCode, res.statusMessage);
                        console.log('opts - %s', util.inspect(reSubOptions));
                        console.log('dev - %s', util.inspect(dev));
                        delete subscriptions[subs[s]];
                        delete sub2dev[sub.sid];
                        subscribe({dev: subs[s]});
                    }
                    else {
                        // console.log("resubscription good %s", res.statusCode);
                        // console.log("dev - %s", util.inspect(dev));
                    }
                });

                resub_request.on('error', function() {
                    //console.log("failed to resubscribe to %s", dev.name );
                    //need to find a way to resubsribe
                    delete subscriptions[subs[s]];
                    delete sub2dev[sub.sid];
                    subscribe({dev: subs[s]});
                });

                resub_request.end();

            }
        }

    };

    setInterval(resubscribe, 100000);

    var subscribe = function(node) {
        var dev = node.dev;
        var device = wemo.get(dev);
        if (device) {
            if (subscriptions[dev]) {
                //exists
                subscriptions[dev].count++;
            }
            else {
                //new

                var ipAddr;
                //device.ip
                var interfaces = os.networkInterfaces();
                var interfaceNames = Object.keys(interfaces);
                for (var name in interfaceNames) {
                    if (interfaceNames.hasOwnProperty(name)) {
                        var addrs = interfaces[interfaceNames[name]];
                        for (var add in addrs) {
                            if (addrs[add].netmask) {
                                //node 0.12 or better
                                if (!addrs[add].internal && addrs[add].family == 'IPv4') {
                                    if (ip.isEqual(ip.mask(addrs[add].address,addrs[add].netmask),ip.mask(device.ip,addrs[add].netmask))) {
                                        ipAddr = addrs[add].address;
                                        break;
                                    }
                                }
                            }
                            else {
                                //node 0.10 not great but best we can do
                                if (!addrs[add].internal && addrs[add].family == 'IPv4') {
                                    ipAddr = addrs[add].address;
                                    break;
                                }
                            }
                        }
                        if (ipAddr) {
                            break;
                        }
                    }
                }

                var callback_url = 'http://' + ipAddr + ':' + settings.uiPort;
                if (settings.httpAdminRoot) {
                    callback_url += settings.httpAdminRoot;
                }

                if (callback_url.lastIndexOf('/') != (callback_url.length - 1)) {
                    callback_url += '/';
                }

                callback_url += 'wemoNG/notification';

                console.log('Callback URL = %s',callback_url);

                var subscribeOptions = {
                    host: device.ip,
                    port: device.port,
                    path: device.device.UDN.indexOf('Bridge-1_0') < 0 ? '/upnp/event/basicevent1' : '/upnp/event/bridge1',
                    method: 'SUBSCRIBE',
                    headers: {
                        'CALLBACK': '<' + callback_url + '>',
                        'NT': 'upnp:event',
                        'TIMEOUT': 'Second-300'
                    }
                };

                //console.log(util.inspect(subscribeOptions));

                var sub_request = http.request(subscribeOptions, function(res) {
                    //console.log("subscribe: %s - %s", device.name, res.statusCode);
                    if (res.statusCode == 200) {
                        subscriptions[dev] = {'count': 1, 'sid': res.headers.sid};
                        sub2dev[res.headers.sid] = dev;
                    }
                    else {
                        console.log('failed to subsrcibe');
                    }
                });

                sub_request.end();
            }
        }
    };

    function unsubscribe(node) {
        var dev = node.dev;
        if (subscriptions[dev]) {
            if (subscriptions[dev].count == 1) {
                var sid = subscriptions[dev].sid;

                var device = wemo.get(dev);
                //need to unsubsribe properly here
                var unSubOpts = {
                    host: device.ip,
                    port: device.port,
                    path: device.device.UDN.indexOf('Bridge-1_0') < 0 ? '/upnp/event/basicevent1' : '/upnp/event/bridge1',
                    method: 'UNSUBSCRIBE',
                    headers: {
                        'SID': sid
                    }
                };

                //console.log(util.inspect(unSubOpts));

                var unSubreq = http.request(unSubOpts, function(res) {
                    //console.log("unsubscribe: %s \n %s", device.name, res.statusCode);
                    delete subscriptions[dev];
                    delete sub2dev[sid];
                });

                unSubreq.end();

            }
            else {
                subscriptions[dev].count--;
            }
        }
        else {
            //shouldn't ever get here
        }
    }

    var wemoNGConfig = function(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;
    };
    RED.nodes.registerType('wemo-dev', wemoNGConfig);

    var wemoNGNode = function(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.device = n.device;
        node.name = n.name;
        node.dev = RED.nodes.getNode(node.device).device;
        node.status({fill: 'red',shape: 'dot',text: 'searching'});

        //console.log("Control - %j" ,this.dev);
        if (!wemo.get(node.dev)) {
            wemo.on('discovered', function(d) {
                if (node.dev === d) {
                    node.status({fill: 'green',shape: 'dot',text: 'found'});
                }
            });
        }
        else {
            node.status({fill: 'green',shape: 'dot',text: 'found'});
        }

        node.on('input', function(msg) {
            var dev = wemo.get(node.dev);

            if (!dev) {
                //need to show that dev not currently found
                console.log('no device found');
                return;
            }

            var on = 0;
            var capability = '10006';
            if (typeof msg.payload === 'string') {
                if (msg.payload == 'on' || msg.payload == '1' || msg.payload == 'true') {
                    on = 1;
                }
                else if (msg.payload === 'toggle') {
                    on = 2;
                }
            } else if (typeof msg.payload === 'number') {
                if (msg.payload >= 0 && msg.payload < 3) {
                    on = msg.payload;
                }
            } else if (typeof msg.payload === 'object') {
                //object need to get complicated here
                if (msg.payload.hasOwnProperty('state') && typeof msg.payload.state === 'number') {
                    if (dev.type === 'socket') {
                        if (msg.payload.state >= 0 && msg.payload.state < 2) {
                            on = msg.payload.state;
                        }
                    }
                    else if (dev.type === 'light' || dev.type === 'group') {
                        // if (msg.payload.state >= 0 && msg.payload.state < 3) {
                        //     on = msg.payload.state;
                        // }
                        var keys = Object.keys(msg.payload);
                        var caps = [];
                        var states = [];
                        for (var i=0; i<keys.length; i++) {
                            if (msg.payload.hasOwnProperty(keys[i])) {
                                if (wemo.reverseCapabilityMap.hasOwnProperty(keys[i])) {
                                    caps.push(wemo.reverseCapabilityMap[keys[i]]);
                                    states.push(msg.payload[keys[i]]);
                                }
                            }
                        }
                        if (caps.length > 0) {
                            capability = caps.join(',');
                            on = states.join(',');
                        }
                    }
                }
            } else if (typeof msg.payload === 'boolean') {
                if (msg.payload) {
                    on = 1;
                }
            }

            if (dev.type == 'socket') {
                //console.log("socket");
                wemo.toggleSocket(dev, on);
            } else if (dev.type === 'light') {
                wemo.setStatus(dev,capability, on);
            } else {
                //console.log('group');
                wemo.setStatus(dev, capability, on);
            }
        });
    };
    RED.nodes.registerType('wemo out', wemoNGNode);

    var wemoNGEvent = function(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.ipaddr = n.ipaddr;
        node.device = n.device;
        node.name = n.name;
        node.topic = n.topic;
        node.dev = RED.nodes.getNode(node.device).device;

        node.status({fill: 'red',shape: 'dot',text: 'searching'});

        var onEvent = function(notification) {
            var d = sub2dev[notification.sid];
            if (d == node.dev) {
                var dd = wemo.get(node.dev);
                notification.type = dd.type;
                notification.name = dd.name;
                if (!notification.id) {
                    notification.id = node.dev;
                }

                var msg = {
                    topic: node.topic ? node.topic : 'wemo',
                    payload: notification
                };

                switch (notification.type){
                    case 'light':
                    case 'group': {
                        if (dd.id === notification.id) {
                            node.send(msg);
                        }
                        break;
                    }
                    case 'socket': {
                        node.send(msg);
                        break;
                    }
                    default: {}
                }
            }
        };

        wemo.on('event', onEvent);

        if (node.dev) {
            //subscribe to events
            if (wemo.get(node.dev)) {
                node.status({fill: 'green',shape: 'dot',text: 'found'});
                subscribe(node);
            }
            else {
                wemo.on('discovered', function(d) {
                    if (node.dev === d) {
                        node.status({fill: 'green',shape: 'dot',text: 'found'});
                        subscribe(node);
                    }
                });
            }
        }
        else if (node.ipaddr) {
            //legacy
            var devices = Object.keys(wemo.devices);
            for (var d in devices) {
                if (devices.hasOwnProperty(d)) {
                    var device = devices[d];
                    if (device.ip === node.ipaddr) {
                        node.dev = device.id;
                        node.status({fill: 'green',shape: 'circle',text: 'reconfigure'});
                        subscribe(node);
                        break;
                    }
                }
            }
        }

        node.on('close', function(done) {
            //should un subscribe from events
            wemo.removeListener('event', onEvent);
            unsubscribe(node);
            done();
        });
    };
    RED.nodes.registerType('wemo in', wemoNGEvent);

    var wemoNGLookup = function(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.device = n.device;
        node.name = n.name;
        node.dev = RED.nodes.getNode(node.device).device;
        node.status({fill: 'red',shape: 'dot',text: 'searching'});

        if (!wemo.get(node.dev)) {
            wemo.on('discovered', function(d) {
                if (node.dev === d) {
                    node.status({fill: 'green',shape: 'dot',text: 'found'});
                }
            });
        }
        else {
            node.status({fill: 'green',shape: 'dot',text: 'found'});
        }

        node.on('input', function(msg) {
            var dev = wemo.get(node.dev);

            if (!dev) {
                //need to show that dev not currently found
                console.log('no device found');
                return;
            }

            //console.log(dev.type);
            if (dev.type === 'light' || dev.type === 'group') {
                //console.log("light");
                wemo.getLightStatus(dev)
                .then(function(status) {
                    // if (status.available) {
                    var caps = status.capabilities.split(',');
                    var vals = status.state.split(',');
                    for (var i=0; i<caps.length; i++) {
                        if (wemo.capabilityMap.hasOwnProperty(caps[i])) {
                            if (vals[i] !== '' && vals[i].indexOf(':') == -1) {
                                status[wemo.capabilityMap[caps[i]]] = parseInt(vals[i]);
                            } else {
                                status[wemo.capabilityMap[caps[i]]] = parseInt(vals[i].substring(0,vals[i].indexOf(':')));
                            }
                        }
                    }
                    delete status.capabilities;
                    // }
                    msg.payload = status;
                    node.send(msg);
                });
            } else {
                console.log("socket");
                //socket
                wemo.getSocketStatus(dev)
                .then(function(status) {
                    msg.payload = {
                        state: status
                    };
                    node.send(msg);
                });
            }
        });

        node.on('close', function(done) {
            done();
        });

    };
    RED.nodes.registerType("wemo lookup", wemoNGLookup);

    RED.httpAdmin.get('/wemoNG/devices', function(req, res) {
        res.json(wemo.devices);
    });

    RED.httpAdmin.use('/wemoNG/notification',bodyParser.raw({type: 'text/xml'}));

    RED.httpAdmin.notify('/wemoNG/notification', function(req, res) {
        var notification = {
            'sid': req.headers.sid
        };
        //console.log("Incoming Event %s", req.body.toString());
        wemo.parseEvent(req.body.toString()).then(function(evt) {
            evt.sid = notification.sid;
            wemo.emit('event',evt);
        });
        res.send('');
    });
};
