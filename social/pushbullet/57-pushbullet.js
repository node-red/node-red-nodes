
module.exports = function(RED) {
    "use strict";
    var PushBullet = require('pushbullet');
    var fs = require('fs');
    var when = require('when');
    var EventEmitter = require('events').EventEmitter;

    function onError(err, node) {
        if (err && node) {
            if (node.emitter) {
                if (!node.emitter.emit('error', err)) {
                    node.error(err);
                }
            }
            else {
                node.error(err);
            }
        }
    }

    function PushbulletConfig(n) {
        RED.nodes.createNode(this, n);
        this.n = n;
        this.name = n.name;
        this._inputNodes = [];
        this.initialised = false;
    }

    RED.nodes.registerType("pushbullet-config", PushbulletConfig, {
        credentials: {
            apikey: {type: "password"}
        }
    });

    PushbulletConfig.prototype.initialise = function() {
        if (this.initialised) {
            return;
        }
        this.emitter = new EventEmitter();

        this.initialised = true;
        var self = this;

        // sort migration from old node
        var apikey;
        if (this.n._migrate) {
            apikey = this.n._apikey;
            this.credentials = {apikey:apikey};
        }
        else if (this.credentials) {
            apikey = this.credentials.apikey;
        }

        if (apikey) {
            try {
                var pusher = new PushBullet(apikey);
                // get 'me' info
                this.me = when.promise(function(resolve, reject) {
                    pusher.me(function(err, me) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(me);
                        }
                    });
                }).otherwise(function(err) {
                    onError(err, self);
                });
                // get latest timestamp
                this.last = when.promise(function(resolve) {
                    pusher.history({limit:1}, function(err, res) {
                        if (err) {
                            resolve(0);
                        }
                        else {
                            try {
                                resolve(res.pushes[0].modified);
                            }
                            catch(ex) {
                                self.warn('Unable to get history.');
                                resolve(0);
                            }
                        }
                    });
                });
                this.pusher = pusher;
            }
            catch(err) {
                onError(err, this);
            }
        }
        else {
            this.error("No credentials set for pushbullet config.");
        }

        this.on("close", function() {
            self._inputNodes.length = 0;
        });
    }

    PushbulletConfig.prototype.onConfig = function(type, cb) {
        this.emitter.on(type, cb);
    }

    PushbulletConfig.prototype.setupStream = function() {
        var self = this;
        if (this.pusher) {
            var stream = this.pusher.stream();
            stream.setMaxListeners(100);
            var closing = false;
            var tout;
            stream.on('message', function(res) {
                if (res.type === 'tickle') {
                    self.handleTickle(res);
                }
                else if (res.type === 'push') {
                    self.pushMsg(res.push);
                }
            });
            stream.on('connect', function() {
                self.emitter.emit('stream_connected');
            });
            stream.on('close', function() {
                self.emitter.emit('stream_disconnected');
                if (!closing) {
                    if (tout) { clearTimeout(tout); }
                    tout = setTimeout(function() {
                        stream.connect();
                    }, 15000);
                }
            });
            stream.on('error', function(err) {
                self.emitter.emit('stream_error', err);
                if (!closing) {
                    if (tout) { clearTimeout(tout); }
                    tout = setTimeout(function() {
                        stream.connect();
                    }, 15000);
                }
            });
            stream.connect();
            this.stream = stream;
            this.on("close",function() {
                if (tout) { clearTimeout(tout); }
                closing = true;
                try { this.stream.close(); }
                catch(err) { } // Ignore error if not connected
            });
        }
    };

    PushbulletConfig.prototype.handleTickle = function(ticklemsg) {
        var self = this;
        if (this.pusher && ticklemsg.subtype === "push") {
            var lastprom = this.last;
            this.last = when.promise(function(resolve) {
                when(lastprom).then(function(last) {
                    self.pusher.history({modified_after: last}, function(err, res) {
                        if (err) {
                            resolve(last);
                            return onError(err);
                        }
                        for (var i=0; i<res.pushes.length; i++) {
                            self.pushMsg(res.pushes[i]);
                        }
                        try {
                            resolve(res.pushes[0].modified);
                        }
                        catch(ex) {
                            resolve(last);
                        }
                    });
                });
            });
        }
    };

    PushbulletConfig.prototype.pushMsg = function(incoming) {
        if (this._inputNodes.length === 0) {
            return;
        }

        var msg = {
            pushtype: incoming.type,
            data: incoming
        }

        if (incoming.dismissed === true) {
            msg.pushtype = 'dismissal';
            msg.topic = 'Push dismissed';
            msg.payload = incoming.iden;
        }
        else if (incoming.active === false && incoming.type === undefined) {
            msg.pushtype = 'delete';
            msg.topic = 'Push deleted';
            msg.payload = incoming.iden;
        }
        else if (incoming.type === 'clip') {
            msg.topic = 'Clipboard content';
            msg.payload = incoming.body;
        }
        else if (incoming.type === 'note') {
            msg.topic = incoming.title;
            msg.payload = incoming.body;
        }
        else if (incoming.type === 'link') {
            msg.topic = incoming.title;
            msg.payload = incoming.url;
            msg.message = incoming.body;
        }
        else if (incoming.type === 'address') {
            msg.topic = incoming.name;
            msg.payload = incoming.address;
        }
        else if (incoming.type === 'list') {
            msg.topic = incoming.title;
            msg.payload = incoming.items;
        }
        else if (incoming.type === 'file') {
            msg.topic = incoming.file_name;
            msg.payload = incoming.file_url;
            msg.message = incoming.body;
        }
        // Android specific, untested
        else if (incoming.type === 'mirror') {
            msg.topic = incoming.title;
            msg.payload = incoming.body;
        }
        else if (incoming.type === 'dismissal') {
            msg.topic = "Push dismissed";
            msg.payload = incoming.iden;
        }
        else if (incoming.type === 'sms_changed') {
            msg.topic = "SMS: "+ incoming.notifications[0].title;
            msg.payload = incoming.notifications[0].body;
            msg.message = incoming;
        }
        else {
            this.error("unknown push type: " + incoming.type + " content: " + JSON.stringify(incoming));
            return;
        }

        for (var i = 0; i < this._inputNodes.length; i++) {
            this._inputNodes[i].emitPush(msg);
        }
    };

    PushbulletConfig.prototype.registerInputNode = function(/*Node*/handler) {
        if (!this.stream) {
            this.setupStream();
        }
        this._inputNodes.push(handler);
    };

    function migrateOldSettings(n) {
        if (n.config === undefined) {
            var newid, config, apikey, deviceid, pushkeys;

            try {
                pushkeys = RED.settings.pushbullet || require(process.env.NODE_RED_HOME+"/../pushkey.js");
            }
            catch(err) { }

            var cred = RED.nodes.getCredentials(n.id);
            // get old apikey
            if (cred && cred.hasOwnProperty("pushkey")) {
                apikey = cred.pushkey;
            }
            else if (pushkeys) {
                apikey = pushkeys.pushbullet;
            }
            // get old device
            if (cred && cred.hasOwnProperty("deviceid")) {
                deviceid = cred.deviceid;
            }
            else if (pushkeys) {
                deviceid = pushkeys.deviceid;
            }

            if (apikey) {
                newid = (1+Math.random()*4294967295).toString(16);
                config = new PushbulletConfig({
                    id: newid,
                    type: 'pushbullet-config',
                    name: n.name,
                    _migrate: true,
                    _apikey: apikey,
                });
            }

            if (!(apikey || deviceid)) {
                return false;
            }

            // override configuration properties to compatible migrated ones
            n.pushtype = "note";
            n.deviceid = deviceid;
            return {
                deviceid: deviceid,
                apikey: apikey,
                config: config,
                id: newid
            };
        }
        return false;
    }

    function PushbulletOut(n) {
        RED.nodes.createNode(this, n);
        var self = this;

        this.migrated = migrateOldSettings(n);
        this.title = n.title;
        this.chan = n.chan;
        this.pushtype = n.pushtype;
        this.pusher = null;

        var configNode;
        if (this.migrated) {
            this.warn('Settings migrated from previous version of Pushbullet Node, please edit node to update settings.');
            this.status({fill: 'yellow', shape: 'ring', text: 'Node migrated'});
            this.deviceid = this.migrated.deviceid;
            configNode = this.migrated.config;
        }
        else {
            this.status({});
            configNode = RED.nodes.getNode(n.config);
            try {
                this.deviceid = this.credentials.deviceid;
            }
            catch(err) { }
        }

        if (configNode) {
            configNode.initialise();
            this.pusher = configNode.pusher;
            configNode.onConfig('error', function(err) {
                self.error(err);
            });
        }

        this.on("input", function(msg) {
            var title = self.title || msg.topic || "Node-RED";
            var deviceid = (self.deviceid === '_msg_')? (msg.deviceid || ""): (self.deviceid || "");
            var pushtype = self.pushtype || msg.pushtype || "note";
            var channel = self.chan || msg.channel;

            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else if (msg.payload) {
                msg.payload = msg.payload.toString();
            }

            if (['delete', 'dismissal', 'updatelist', '_rawupdate_'].indexOf(pushtype) === -1) {
                if (channel) {
                    deviceid = { channel_tag : channel };
                }
                else if (deviceid === "") {
                    try {
                        when(configNode.me).then(function(me) {
                            if (me) {
                                deviceid = me.email;
                                self.pushMsg(pushtype, deviceid, title, msg);
                            }
                            else {
                                self.error("Unable to push",msg);
                            }
                        });
                        return;
                    }
                    catch(err) {
                        self.error('Unable to push to "all".');
                    }
                }
                else if (!isNaN(deviceid)) {
                    deviceid = Number(deviceid);
                }
            }
            self.pushMsg(pushtype, deviceid, title, msg);
        });
    }
    RED.nodes.registerType("pushbullet", PushbulletOut, {
        credentials: {
            deviceid: {value: ""},
            pushkey: {value: ""}
        }
    });

    PushbulletOut.prototype.pushMsg = function(pushtype, deviceid, title, msg) {
        var self = this;
        if (this.pusher) {
            var handleErr = function(msg) {
                return function(err) {
                    if (err) {
                        self.error(msg);
                        onError(err, self);
                    }
                }
            }

            if (deviceid) {
                if (pushtype === 'note') {
                    this.pusher.note(deviceid, title, msg.payload, handleErr('Unable to push note'));
                }
                else if (pushtype === 'address') {
                    this.pusher.address(deviceid, title, msg.payload, handleErr('Unable to push address'));
                }
                else if (pushtype === 'list') {
                    this.pusher.list(deviceid, title, JSON.parse(msg.payload), handleErr('Unable to push list'));
                }
                else if (pushtype === 'link') {
                    this.pusher.push(deviceid, {
                        type: 'link',
                        title: title,
                        body: msg.message,
                        url: msg.payload
                    }, handleErr('Unable to push link'));
                }
                else if (pushtype === 'file') {
                    // Workaround for Pushbullet dep not handling error on file open
                    if (fs.existsSync(msg.payload)) {
                        this.pusher.file(deviceid, msg.payload, title, handleErr('Unable to push file'));
                    }
                    else {
                        this.error('File does not exist!');
                    }
                }
                else if (pushtype === '_raw_') {
                    this.pusher.push(deviceid, msg.raw, handleErr('Unable to push raw data'));
                }
            }

            if (msg.data && msg.data.iden) {
                if (pushtype === 'delete') {
                    this.pusher.deletePush(msg.data.iden, handleErr('Unable to delete push'));
                }
                else if (pushtype === 'dismissal') {
                    this.pusher.updatePush(msg.data.iden, {dismissed: true}, handleErr('Unable to dismiss push'));
                }
                else if (pushtype === 'updatelist') {
                    try {
                        var data = JSON.parse(msg.payload);
                        if (msg.data.type && msg.data.type !== 'list') {
                            this.warn('Trying to update list items in non list push');
                        }
                        this.pusher.updatePush(msg.data.iden, {items: data}, handleErr('Unable to update list'));
                    }
                    catch(err) {
                        this.warn("Invalid list");
                    }
                }
                else if (pushtype === '_rawupdate_') {
                    this.pusher.updatePush(msg.data.iden, msg.raw, handleErr('Unable to update raw data'));
                }
            }
        }
        else {
            self.error("Pushbullet credentials not set/found.");
        }
    };

    RED.httpAdmin.get('/pushbullet/:id/migrate', RED.auth.needsPermission('pushbullet.read'), function(req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node && node.migrated) {
            if (req.query.save) {
                var promise;
                if (node.migrated.apikey) {
                    promise = RED.nodes.addCredentials(node.migrated.id, {apikey: node.migrated.apikey});
                }
                if (node.migrated.deviceid) {
                    when(promise).then(function() {
                        RED.nodes.addCredentials(req.params.id, {deviceid: node.migrated.deviceid});
                    });
                }
            }
            res.send(JSON.stringify({migrated: true, config: node.migrated.id}));
        }
        else {
            res.send("{}");
        }
    });

    RED.httpAdmin.get('/pushbullet/:id/devices', RED.auth.needsPermission('pushbullet.read'), function(req, res) {
        var config = RED.nodes.getNode(req.params.id);
        var cred = RED.nodes.getCredentials(req.params.id);
        var pb;

        if (config && config.pusher) {
            config.pusher.devices(function(err, chans) {
                if (err) {
                    res.send("[]");
                    return onError(err, config);
                }
                res.send(JSON.stringify(filterdActiveDevices(chans.devices)));
            });
        }
        else if (cred && cred.apikey) {
            pb = new PushBullet(cred.apikey);
            pb.devices(function(err, chans) {
                if (err) {
                    res.send("[]");
                    return onError(err, config);
                }
                res.send(JSON.stringify(filterdActiveDevices(chans.devices)));
            });
        }
        else if (req.query.apikey) {
            pb = new PushBullet(req.query.apikey);
            pb.devices(function(err, chans) {
                if (err) {
                    res.send("[]");
                    return onError(err, config);
                }
                res.send(JSON.stringify(filterdActiveDevices(chans.devices)));
            });
        }
        else {
            res.send("[]");
        }
    });

    function filterdActiveDevices(devices) {
        var activeDevices = [];
        for (var i=0; i<devices.length; i++) {
            if (devices[i].active) {
                activeDevices.push(devices[i]);
            }
        }
        return activeDevices;
    }

    function PushbulletIn(n) {
        RED.nodes.createNode(this, n);
        var self = this;
        var config = RED.nodes.getNode(n.config);
        if (config) {
            config.initialise();
            config.registerInputNode(this);
            config.onConfig('error', function(err) {
                self.error(err);
            });
            config.onConfig('stream_connected', function() {
                self.status({fill:'green', shape:'dot', text:'connected'});
            });
            config.onConfig('stream_disconnected', function(err) {
                self.status({fill:'grey', shape:'ring', text:'disconnected'});
            });
            config.onConfig('stream_error', function(err) {
                self.status({fill:'red', shape:'ring', text:'error, see log'});
                self.error(err);
            });
        }
    }
    RED.nodes.registerType("pushbullet in", PushbulletIn, {
        credentials: {
            filters: {value: []}
        }
    });

    PushbulletIn.prototype.emitPush = function(msg) {
        try {
            if (this.credentials.filters.length > 0) {
                if ( (this.credentials.filters.indexOf(msg.data.source_device_iden) > -1) ||
                    (this.credentials.filters.indexOf(msg.data.target_device_iden) > -1) ||
                    (!msg.data.target_device_iden && !msg.data.source_device_iden)) { /* All */
                    this.send(msg);
                }
            }
            else {
                this.send(msg);
            }
        }
        catch(err) {
            this.send(msg);
        }
    }
}
