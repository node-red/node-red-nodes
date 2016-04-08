/**
 * Copyright 2016 IBM Corp.
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
"use strict";
var util = require('util');
var ip = require('ip');
var bodyParser = require('body-parser');
var http = require('http');
var os = require('os');

var WeMoNG = require('./lib/wemo.js');

var wemo = new WeMoNG();  

//this won't work as there is no way to stop it...
//but is that a problem?
var interval = setInterval(wemo.start.bind(wemo), 60000);
wemo.start();

module.exports = function(RED) {

  var settings = RED.settings;

  var subscriptions = {};
  var sub2dev = {};

  function resubscribe() {

    var subs = Object.keys(subscriptions);
    for (var s in subs) {
      var sub = subscriptions[subs[s]];
      var dev = wemo.get(subs[s]);
      var reSubOptions = {
        host: dev.ip,
        port: dev.port,
        path: dev.device.UDN.indexOf('Bridge-1_0') < 0 ? '/upnp/event/basicevent1': '/upnp/event/bridge1',
        method: 'SUBSCRIBE',
        headers: {
          'SID': sub.sid,
          'TIMEOUT': 'Second-300'
        }
      };

      var resub_request = http.request(reSubOptions, function(res) {
        //shoudl raise an error if needed
        if (res.statusCode != 200) {
          console.log("problem with resubscription %s - %s", res.statusCode, res.statusMessage);
          console.log("opts - %s", util.inspect(reSubOptions));
          console.log("dev - %s", util.inspect(dev));
          delete subscriptions[dev];
          delete sub2dev[sub.sid];
          subscribe({dev: subs[s]});
        } else {
          // console.log("resubscription good %s", res.statusCode);
          // console.log("dev - %s", util.inspect(dev));
        }
      });

      resub_request.on('error', function(){
        //console.log("failed to resubscribe to %s", dev.name );
        //need to find a way to resubsribe
        delete subscriptions[dev];
        delete sub2dev[sub.sid];
        subscribe({dev: subs[s]});
      });

      resub_request.end();

    }

  }

  setInterval(resubscribe, 200000);

  function subscribe(node) {
    var dev = node.dev;
    var device = wemo.get(dev);
    if (device){
      if (subscriptions[dev]) {
        //exists
        subscriptions[dev].count++;
      } else {
        //new

        var ipAddr;
        //device.ip
        var interfaces = os.networkInterfaces();
        var interfaceNames = Object.keys(interfaces);
        for (var name in interfaceNames) {
          var addrs = interfaces[interfaceNames[name]];
          for (var add in addrs) {
            if (addrs[add].netmask){
              //node 0.12 or better
              if (!addrs[add].internal && addrs[add].family == 'IPv4') {
                if (ip.isEqual(ip.mask(addrs[add].address,addrs[add].netmask),ip.mask(device.ip,addrs[add].netmask))) {
                  ipAddr = addrs[add].address;
                  break;
                }
              }
            } else {
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

        var callback_url = 'http://' + ipAddr + ':' + settings.uiPort;
        if(settings.httpAdminRoot) {
          callback_url += settings.httpAdminRoot;
        }

        if (callback_url.lastIndexOf('/') != (callback_url.length -1)) {
          callback_url += '/';
        }

        callback_url += 'wemoNG/notification';

        console.log("Callback URL = %s",callback_url);

        var subscribeOptions = {
          host: device.ip,
          port: device.port,
          path: device.device.UDN.indexOf('Bridge-1_0') < 0 ?  '/upnp/event/basicevent1': '/upnp/event/bridge1',
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
          } else {
            console.log("failed to subsrcibe");
          }
        });

        sub_request.end();
      }
    }
  }

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
          path: device.device.UDN.indexOf('Bridge-1_0') < 0 ?  '/upnp/event/basicevent1': '/upnp/event/bridge1',
          method: 'UNSUBSCRIBE',
          headers: {
            'SID': sid
          }
        };

        //console.log(util.inspect(unSubOpts));

        var unSubreq = http.request(unSubOpts, function(res){
          //console.log("unsubscribe: %s \n %s", device.name, res.statusCode);
          delete subscriptions[dev];
          delete sub2dev[sid];
        });

        unSubreq.end();

      } else {
        subscriptions[dev].count--;
      }
    } else {
      //shouldn't ever get here
    }
  }

  function wemoNGConfig(n) {
    RED.nodes.createNode(this,n);
    this.device = n.device;
  }
  RED.nodes.registerType("wemo-dev", wemoNGConfig);

  function wemoNGNode(n) {
    RED.nodes.createNode(this,n);
    this.device = n.device;
    this.name = n.name;
    this.dev = RED.nodes.getNode(this.device).device;
    var node = this;
    this.status({fill:"red",shape:"dot",text:"searching"});

    //console.log("Control - %j" ,this.dev);
    if (!wemo.get(node.dev)){
      wemo.on('discovered', function(d){
        if (node.dev === d) {
          node.status({fill:"green",shape:"dot",text:"found"});
        }
      });
    } else {
      node.status({fill:"green",shape:"dot",text:"found"});
    }

    this.on('input', function(msg){
      var dev = wemo.get(node.dev);

      if (!dev) {
        //need to show that dev not currently found
        console.log("no device found");
        return;
      }

      var on = 0;
      if (typeof msg.payload === 'string') {
        if (msg.payload == 'on' || msg.payload == '1' || msg.payload == 'true') {
          on = 1;
        } else if (msg.payload === 'toggle') {
          on = 2;
        }
      } else if (typeof msg.payload === 'number') {
        if (msg.payload >= 0 && msg.payload < 3) {
          on = msg.payload;
        }
      } else if (typeof msg.payload === 'object') {
        //object need to get complicated here
        if (msg.payload.state && typeof msg.payload.state === 'number') {
          if (dev.type === 'socket') {
            if (msg.payload >= 0 && msg.payload < 2) {
              on = msg.payload.state
            }
          } else if (dev.type === 'light' || dev.type === 'group') {
            if (msg.payload >= 0 && msg.payload < 3) {
              on = msg.payload.state;
            }
          }
        }
      } else if (typeof msg.payload === 'boolean') {
        if (msg.payload) {
          on = 1;
        }
      }

      if (dev.type === 'socket') {
        //console.log("socket");
        wemo.toggleSocket(dev, on);
      } else if (dev.type === 'light`') {
        //console.log("light");
        wemo.setStatus(dev,"10006", on);
      } else {
        console.log("group");
        wemo.setStatus(dev, "10006", on);
      }
    });
  }
  RED.nodes.registerType("wemo out", wemoNGNode);

  function wemoNGEvent(n) {
    RED.nodes.createNode(this,n);
    this.ipaddr = n.ipaddr;
    this.device = n.device;
    this.name = n.name;
    this.topic = n.topic;
    this.dev = RED.nodes.getNode(this.device).device;
    var node = this;
    
    this.status({fill:"red",shape:"dot",text:"searching"});

    var onEvent = function(notification){
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
          case 'group':
            if (dd.id === notification.id) {
              node.send(msg);
            }
            break;
          case 'socket':
            node.send(msg);
            break;
          default:
        }

      }
    };

    wemo.on('event', onEvent);

    if (this.dev) {
      //subscribe to events
      if (wemo.get(this.dev)) {
        this.status({fill:"green",shape:"dot",text:"found"});
        subscribe(node);
      } else {
        wemo.on('discovered', function(d){
          if (node.dev === d) {
            node.status({fill:"green",shape:"dot",text:"found"});
            subscribe(node);
          }
        });
      }
    } else if (this.ipaddr) {
      //legacy
      var devices = Object.keys(wemo.devices);
      for (var d in devices) {
        var device = devices[d];
        if (device.ip === this.ipaddr) {
          this.dev = device.id;
          node.status({fill:"green",shape:"circle",text:"reconfigure"});
          subscribe(node);
          break;
        }
      }
    }


    this.on('close', function(done){
      //should un subscribe from events
      wemo.removeListener('event', onEvent);
      unsubscribe(node);
      done();
    });
  }
  RED.nodes.registerType("wemo in", wemoNGEvent)

  RED.httpAdmin.get('/wemoNG/devices', function(req,res){
    res.json(wemo.devices);

  });

  RED.httpAdmin.use('/wemoNG/notification',bodyParser.raw({type: 'text/xml'}));

  RED.httpAdmin.notify('/wemoNG/notification', function(req, res){
    var notification = {
      'sid': req.headers.sid
    };
    //console.log("Incoming Event %s", req.body.toString());
    wemo.parseEvent(req.body.toString()).then(function(evt){
      evt.sid = notification.sid;
      wemo.emit('event',evt);
    });
    res.send("");
  });

}