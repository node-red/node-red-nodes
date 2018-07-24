
"use strict"

var events = require('events');
var util = require('util');
var Client = require('node-ssdp').Client;
var xml2js  = require('xml2js');
var request = require('request');
var http = require('http');
var url = require('url');
var Q = require('q');

var urn = 'urn:Belkin:service:basicevent:1';

var postbodyheader = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">',
    '<s:Body>'].join('\n');

var postbodyfooter = ['</s:Body>',
  '</s:Envelope>'
].join('\n');

var getenddevs = {};
getenddevs.path = '/upnp/control/bridge1';
getenddevs.action = '"urn:Belkin:service:bridge:1#GetEndDevices"';
getenddevs.body = [
  postbodyheader,
  '<u:GetEndDevices xmlns:u="urn:Belkin:service:bridge:1">',
  '<DevUDN>%s</DevUDN>',
  '<ReqListType>PAIRED_LIST</ReqListType>',
  '</u:GetEndDevices>',
  postbodyfooter
].join('\n');

var getcapabilities = {};
getcapabilities.path = '/upnp/control/bridge1';
getcapabilities.action = '"urn:Belkin:service:bridge:1#GetCapabilityProfileIDList"';
getcapabilities.body = [
  postbodyheader,
  '<u:GetCapabilityProfileIDList xmlns:u="urn:Belkin:service:bridge:1">',
  '<DevUDN>%s</DevUDN>',
  '</u:GetCapabilityProfileIDList>',
  postbodyfooter
].join('\n');

var getDevStatus = {
  method: 'POST',
  path: '/upnp/control/bridge1',
  action: '"urn:Belkin:service:bridge:1#GetDeviceStatus"',
  body: [
    postbodyheader,
    '<u:GetDeviceStatus xmlns:u="urn:Belkin:service:bridge:1">',
    '<DeviceIDs>%s</DeviceIDs>',
    '</u:GetDeviceStatus>',
    postbodyfooter
  ].join('\n')
};

var getSocketState = {
  method: 'POST',
  path: '/upnp/control/basicevent1',
  action: '"urn:Belkin:service:basicevent:1#GetBinaryState"',
  body: [
    postbodyheader,
    '<u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">',
    '</u:GetBinaryState>',
    postbodyfooter
  ].join('\n')
}


var setdevstatus = {};
setdevstatus.path = '/upnp/control/bridge1';
setdevstatus.action = '"urn:Belkin:service:bridge:1#SetDeviceStatus"';
setdevstatus.body = [
  postbodyheader,
  '<u:SetDeviceStatus xmlns:u="urn:Belkin:service:bridge:1">',
  '<DeviceStatusList>',
  '&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;&lt;DeviceStatus&gt;&lt;IsGroupAction&gt;%s&lt;/IsGroupAction&gt;&lt;DeviceID available=&quot;YES&quot;&gt;%s&lt;/DeviceID&gt;&lt;CapabilityID&gt;%s&lt;/CapabilityID&gt;&lt;CapabilityValue&gt;%s&lt;/CapabilityValue&gt;&lt;/DeviceStatus&gt;',
  '</DeviceStatusList>',
  '</u:SetDeviceStatus>',
  postbodyfooter
].join('\n');

var capabilityMap = {
    '10006': 'state',
    '10008': 'dim',
    '10300': 'color',
    '30301': 'temperature'
  };

var reverseCapabilityMap = {
    'state': '10006',
    'dim': '10008',
    'color': '10300',
    'temperature': '30301'
  };

var WeMoNG = function () {
  this.devices = {};
  this._client;
  this._interval;
  events.EventEmitter.call(this);

  this.capabilityMap = capabilityMap;

  this.reverseCapabilityMap = reverseCapabilityMap;

}

util.inherits(WeMoNG, events.EventEmitter);

WeMoNG.prototype.start = function start() {
  //console.log("searching");
  var _wemo = this;
  _wemo.setMaxListeners(0);
  _wemo._client = new Client({'explicitSocketBind': true});
  _wemo._client.setMaxListeners(0);
  _wemo._client.on('response', function (headers, statusCode, rinfo) {
    var location = url.parse(headers.LOCATION);
    var port = location.port;
    request.get(location.href, function(err, res, xml) {
      if (!err) {
        xml2js.parseString(xml, function(err, json) {
          if (!err && json && json.root) {
            var device = { ip: location.hostname, port: location.port };
            for (var key in json.root.device[0]) {
              device[key] = json.root.device[0][key][0];
            }
            if (device.deviceType == "urn:Belkin:device:bridge:1") {
              //console.log( device.ip + ' -' + device.deviceType);
              var ip = device.ip;
              var port = device.port;
              var udn = device.UDN;
              var postoptions = {
                host: ip,
                port: port,
                path: getenddevs.path,
                method: 'POST',
                headers: {
                  'SOAPACTION': getenddevs.action,
                  'Content-Type': 'text/xml; charset="utf-8"',
                  'Accept': ''
                }
              };

              var post_request = http.request(postoptions, function(res) {
                var data = "";
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                  data += chunk;
                });

                res.on('end',function() {
                  xml2js.parseString(data, function(err, result) {
                    if(!err) {
                      if (result["s:Envelope"]) {
                        var list = result["s:Envelope"]["s:Body"][0]["u:GetEndDevicesResponse"][0].DeviceLists[0];
                        xml2js.parseString(list, function(err, result2) {
                          if (!err) {
                            var devinfo = result2.DeviceLists.DeviceList[0].DeviceInfos[0].DeviceInfo;
                            for (var i=0; i<devinfo.length; i++) {
                              var light = {
                                "ip": ip,
                                "port": port,
                                "udn": device.UDN,
                                "name": devinfo[i].FriendlyName[0],
                                "id": devinfo[i].DeviceID[0],
                                "capabilities": devinfo[i].CapabilityIDs[0],
                                "state": devinfo[i].CurrentState[0],
                                "type": "light",
                                "device": device
                              };
                              var key = device.serialNumber + "-" + light.id;
                              if (!_wemo.devices[key]){
                                _wemo.devices[key] = light;
                                _wemo.emit('discovered', key);
                              } else {
                                _wemo.devices[key] = light;
                              }
                            }
                            var groupinfo = result2.DeviceLists.DeviceList[0].GroupInfos;
                            if (groupinfo) {
                              for(var i=0; i<groupinfo.length; i++) {
                                var group = {
                                  "ip": ip,
                                  "port": port,
                                  "udn": device.UDN,
                                  "name": groupinfo[i].GroupInfo[0].GroupName[0],
                                  "id": groupinfo[i].GroupInfo[0].GroupID[0],
                                  "capabilities": groupinfo[i].GroupInfo[0].GroupCapabilityIDs[0],
                                  "state": groupinfo[i].GroupInfo[0].GroupCapabilityValues[0],
                                  "type": "light group",
                                  "lights": [],
                                  "device": device
                                }
                                for(var j=0; j<groupinfo[i].GroupInfo[0].DeviceInfos[0].DeviceInfo.length; j++) {
                                  group.lights.push(groupinfo[i].GroupInfo[0].DeviceInfos[0].DeviceInfo[j].DeviceID[0]);
                                }
                              }
                              var key = device.serialNumber + "-" + group.id;
                              if (!_wemo.devices[key]) {
                                _wemo.devices[key] = group;
                                _wemo.emit('discovered', key);
                              } else {
                                _wemo.devices[key] = group;
                              }
                            }
                          }
                        });
                      }
                    }
                  });
                });
              });

              post_request.write(util.format(getenddevs.body, udn));
              post_request.end();

            } else if (device.deviceType.indexOf('urn:Belkin:device') != -1) {
              //socket
              var socket = {
                "ip": location.hostname,
                "port": location.port,
                "name": device.friendlyName,
                "type": "socket",
                "device": device
              };
              if (!_wemo.devices[device.serialNumber]) {
                _wemo.devices[device.serialNumber] = socket;
                _wemo.emit('discovered',device.serialNumber);
              } else {
                _wemo.devices[device.serialNumber] = socket;
              }
            } else {
              //other stuff
              //console.log( device.ip + ' -' + device.deviceType);
            }
          } else {
            console.error("failed to parse respose from " + location.href);
            console.error(xml);
            console.error(err);
          }
        });
      } else {
        console.error("Failed to GET info from " + location.href);
        console.error(err);
      }
    });
  });
  _wemo._client.search(urn);
  setTimeout(function(){
    //console.log("stopping");
    _wemo._client._stop();
    //console.log("%j", devices);
  }, 10000);
}

WeMoNG.prototype.get = function get(deviceID) {
  return this.devices[deviceID];
}

WeMoNG.prototype.toggleSocket = function toggleSocket(socket, on) {
  var postoptions = {
    host: socket.ip,
    port: socket.port,
    path: "/upnp/control/basicevent1",
    method: 'POST',
    headers: {
      'SOAPACTION': '"urn:Belkin:service:basicevent:1#SetBinaryState"',
      'Content-Type': 'text/xml; charset="utf-8"',
      'Accept': ''
    }
  };

    var post_request = http.request(postoptions, function(res) {
      var data = "";
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        data += chunk
      });

      res.on('end', function(){
        //console.log(data);
      });
    });

    post_request.on('error', function (e) {
      console.log(e);
      console.log("%j", postoptions);
    });

    var body = [
      postbodyheader,
      '<u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1">',
      '<BinaryState>%s</BinaryState>',
      '</u:SetBinaryState>',
      postbodyfooter
    ].join('\n');

    post_request.write(util.format(body, on));
    post_request.end();
}

WeMoNG.prototype.getSocketStatus = function getSocketStatus(socket) {
  var postoptions = {
    host: socket.ip,
    port: socket.port,
    path: getSocketState.path,
    method: getSocketState.method,
    headers: {
      'SOAPACTION': getSocketState.action,
      'Content-Type': 'text/xml; charset="utf-8"',
      'Accept': ''
    }
  }

  var def = Q.defer();

  var post_request = http.request(postoptions, function(res){
    var data = "";
    res.setEncoding('utf8');
    res.on('data', function(chunk){
      data += chunk;
    });

    res.on('end', function(){
      xml2js.parseString(data, function(err, result){
        if (!err) {
          var status = result["s:Envelope"]["s:Body"][0]["u:GetBinaryStateResponse"][0]["BinaryState"][0];
          status = parseInt(status);
          def.resolve(status);
        }
      });
    });
  });

  post_request.on('error', function (e) {
    console.log(e);
    console.log("%j", postoptions);
    def.reject();
  });

  post_request.write(getSocketState.body);
  post_request.end();

  return def.promise;
};

WeMoNG.prototype.getLightStatus = function getLightStatus(light) {
  var postoptions = {
    host: light.ip,
    port: light.port,
    path: getDevStatus.path,
    method: getDevStatus.method,
    headers: {
      'SOAPACTION': getDevStatus.action,
      'Content-Type': 'text/xml; charset="utf-8"',
      'Accept': ''
    }
  };

  var def = Q.defer();

  var post_request = http.request(postoptions, function(res){
    var data = "";
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      data += chunk;
    });

    res.on('end', function() {
      xml2js.parseString(data, function(err, result){
        if(!err) {
          if (result["s:Envelope"]) {
            var status = result["s:Envelope"]["s:Body"][0]["u:GetDeviceStatusResponse"][0].DeviceStatusList[0];
            xml2js.parseString(status, function(err,result2){
              if (!err) {
                var available = result2['DeviceStatusList']['DeviceStatus'][0]['DeviceID'][0]['$'].available === 'YES';
                var state = result2['DeviceStatusList']['DeviceStatus'][0]['CapabilityValue'][0];
                var capabilities = result2['DeviceStatusList']['DeviceStatus'][0]['CapabilityID'][0];
                var obj = {
                  available: available,
                  state: state,
                  capabilities: capabilities
                };
                def.resolve(obj);
              } else {
                console.log("err");
              }
            });
          }
        } else {
          console.log("err");
        }
      });
    });
  });

  post_request.on('error', function (e) {
    console.log(e);
    console.log("%j", postoptions);
    def.reject();
  });

  post_request.write(util.format(getDevStatus.body, light.id));
  post_request.end();

  return def.promise;
}

WeMoNG.prototype.setStatus = function setStatus(light, capability, value) {
  var postoptions = {
    host: light.ip,
    port: light.port,
    path: setdevstatus.path,
    method: 'POST',
    headers: {
      'SOAPACTION': setdevstatus.action,
      'Content-Type': 'text/xml; charset="utf-8"',
      'Accept': ''
    }
  };

  var post_request = http.request(postoptions, function(res) {
    var data = "";
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      data += chunk;
    });

    res.on('end', function() {
      //console.log(data);
    });
  });

  post_request.on('error', function (e) {
    console.log(e);
    console.log("%j", postoptions);
  });

  //console.log(util.format(setdevstatus.body, light.id, capability, value));

  post_request.write(util.format(setdevstatus.body, light.type === 'light'?'NO':'YES',light.id, capability, value));
  post_request.end();
}

//need to promisify this so it returns
WeMoNG.prototype.parseEvent = function parseEvent(evt) {
  var msg = {};
  msg.raw = evt;

  var def = Q.defer();

  xml2js.parseString(evt, function(err, res){
    if (!err) {
      var prop = res['e:propertyset']['e:property'][0];
      if (prop.hasOwnProperty('StatusChange')) {
        xml2js.parseString(prop['StatusChange'][0], function(err, res){
          if (!err && res != null) {
            msg.id = res['StateEvent']['DeviceID'][0]['_'];
            msg.capability = res['StateEvent']['CapabilityId'][0];
            msg.capabilityName = capabilityMap[msg.capability];
            msg.value = res['StateEvent']['Value'][0];
            def.resolve(msg);
          }
        });
      } else if (prop.hasOwnProperty('BinaryState')) {
        msg.state = prop['BinaryState'][0];
        if (msg.state.length > 1) {
          var parts = msg.state.split('|');
          msg.state = parts[0];
          msg.power = parts[7]/1000;
        }

        def.resolve(msg);
      } else {
        console.log("unhandled wemo event type \n%s", util.inspect(prop, {depth:null}));
      }
    } else {
      //error
    }
  });

  return def.promise;
}


// Based on https://github.com/theycallmeswift/hue.js/blob/master/lib/helpers.js
// TODO: Needs to be tweaked for more accurate color representation
WeMoNG.prototype.rgb2xy = function rgb2xy(red, green, blue) {
  var xyz;
  var rgb = [red / 255, green / 255, blue / 255];

  for (var i = 0; i < 3; i++) {
    if (rgb[i] > 0.04045) {
      rgb[i] = Math.pow(((rgb[i] + 0.055) / 1.055), 2.4);
    } else {
      rgb[i] /= 12.92;
    }
    rgb[i] = rgb[i] * 100;
  }

  xyz = [
    rgb[0] * 0.4124 + rgb[1] * 0.3576 + rgb[2] * 0.1805,
    rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722,
    rgb[0] * 0.0193 + rgb[1] * 0.1192 + rgb[2] * 0.9505
  ];

  return [
    xyz[0] / (xyz[0] + xyz[1] + xyz[2]) * 65535,
    xyz[1] / (xyz[0] + xyz[1] + xyz[2]) * 65535
  ];
};

//http://stackoverflow.com/questions/22894498/philips-hue-convert-xy-from-api-to-hex-or-rgb
WeMoNG.prototype.xy2rgb = function xy2rgb(x,y,bri) {
  z = 1.0 - x - y;
  Y = bri / 255.0; // Brightness of lamp
  X = (Y / y) * x;
  Z = (Y / y) * z;
  r = X * 1.612 - Y * 0.203 - Z * 0.302;
  g = -X * 0.509 + Y * 1.412 + Z * 0.066;
  b = X * 0.026 - Y * 0.072 + Z * 0.962;
  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
  maxValue = Math.max(r,g,b);
  r /= maxValue;
  g /= maxValue;
  b /= maxValue;
  r = r * 255;   if (r < 0) { r = 255 };
  g = g * 255;   if (g < 0) { g = 255 };
  b = b * 255;   if (b < 0) { b = 255 };

  return [r,g,b];
};

module.exports  = WeMoNG;
