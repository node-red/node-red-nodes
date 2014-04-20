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

var RED = require(process.env.NODE_RED_HOME + "/red/red");
var PushBullet = require('pushbullet');
var util = require('util');

try {
    var pushkey = RED.settings.pushbullet || require(process.env.NODE_RED_HOME + "/../pushkey.js");
}
catch (err) {
}

var querystring = require('querystring');

//REST API for credentials
RED.httpAdmin.get('/pushbullet-api/global', function (req, res) {
    res.send(JSON.stringify({hasApiKey: (pushkey && pushkey.pushbullet && pushkey.deviceid && pushkey.pushbullet != '' && pushkey.deviceid != '')}));
});
RED.httpAdmin.get('/pushbullet-api/:id', function (req, res) {
    var credentials = RED.nodes.getCredentials(req.params.id);
    if (credentials) {
        res.send(JSON.stringify({hasApiKey: (credentials.apikey && credentials.apikey != ""), deviceid: credentials.deviceid}));
    } else {
        res.send(JSON.stringify({}));
    }
});

RED.httpAdmin.delete('/pushbullet-api/:id', function (req, res) {
    RED.nodes.deleteCredentials(req.params.id);
    res.send(200);
});

RED.httpAdmin.post('/pushbullet-api/:id', function (req, res) {
    var body = "";
    req.on('data', function (chunk) {
        body += chunk;
    });
    req.on('end', function () {
        var newCreds = querystring.parse(body);
        var credentials = RED.nodes.getCredentials(req.params.id) || {};
        if (newCreds.apikey == "") {
            delete credentials.apikey;
        } else {
            credentials.apikey = newCreds.apikey || credentials.apikey;
        }
        if (newCreds.deviceid == "" || newCreds.deviceid == null) {
            delete credentials.deviceid;
        } else {
            credentials.deviceid = newCreds.deviceid;
        }
        RED.nodes.addCredentials(req.params.id, credentials);
        res.send(200);
    });
});

function PushBulletDevice(n) {
    RED.nodes.createNode(this, n);
    this.name = n.name;
    var credentials = RED.nodes.getCredentials(n.id);
    if (credentials) {
        this.apikey = credentials.apikey;
        this.deviceid = credentials.deviceid;
    }
}
RED.nodes.registerType("bullet-device", PushBulletDevice);

function PushbulletNode(n) {
    RED.nodes.createNode(this, n);
    this.title = n.title;
    var node = this;
    this.api = RED.nodes.getNode(n.device);

    if (this.api) {
        this.pusher = new PushBullet(this.api.apikey);
        this.deviceId = this.api.deviceid;
    } else if (pushkey) {
        this.pusher = new PushBullet(pushkey.pushbullet);
        this.deviceId = pushkey.deviceid;
    } else {
        this.error("missing pushbullet credentials");
        return;
    }


    this.on("input", function (msg) {
        var titl = this.title || msg.topic || "Node-RED";
        if (typeof(msg.payload) === 'object') {
            msg.payload = JSON.stringify(msg.payload);
        }
        else {
            msg.payload = msg.payload.toString();
        }
        try {
            this.pusher.note(this.deviceId, titl, msg.payload, function (err, response) {
                if (err) node.error("Pushbullet error: " + err);
                //console.log(response);
            });
        }
        catch (err) {
            node.error(err);
        }

    });
}

RED.nodes.registerType("pushbullet", PushbulletNode);
