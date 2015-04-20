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

/*jshint expr: true*/

var sinon = require('sinon');
var should = require("should");
var proxyquire = require("proxyquire");
var EventEmitter = require('events').EventEmitter
var util = require('util');
var data = require("./data");
var path = require("path");
var helper = require('../../../test/helper.js');

// Mute "Starting/Stopping flows to stdout"

//var flows = proxyquire('../../../.node-red/red/nodes/flows.js', {
//var flows = proxyquire('../../../../../red/nodes/flows.js', {
    //util: {
        //log: function(msg) {
            //if(!/ing flows/.test(msg)) {
                //util.log(msg);
            //}
        //}
    //}
//});

//var helper = require('../../../.node-red/test/nodes/helper.js');
//var helper = require('../../../../../test/nodes/helper.js');

var currentPB = null;
var pushbulletStub = function() {
    var self = this;
    currentPB = this;

    this.streamEmitter = new EventEmitter();
    this.streamObj = {
        on: function(key, cb){ self.streamEmitter.on(key, cb);},
        close: function(){},
        connect: function(){}
    }

    // funcs
    this.me = function(cb){ cb(null, data.me); };
    this.history = function(opts, cb){ cb(null, getPushReply('note')); };
    this.devices = function(){};

    // pushes
    this.note = function(){};
    this.file = function(){};
    this.link = function(){};
    this.list = function(){};
    this.address = function(){};
    this.push = function(){};

    // websocket
    this.stream = function() {
        return this.streamObj;
    };

    // modifiers
    this.deletePush = function(){};
    this.updatePush = function(){};

};

function getReply() {
    return JSON.parse(JSON.stringify(data.base));
}

function getPushReply(name) {
    var r = JSON.parse(JSON.stringify(data.base));
    r.pushes.push(JSON.parse(JSON.stringify(data[name])))
    return r;
}

var pushbulletNode = proxyquire("../../../social/pushbullet/57-pushbullet.js", {
    "pushbullet": function(apikey) {
        currentPB.apikey = apikey;
        return currentPB;
    }
});

describe('pushbullet node', function() {

    beforeEach(function(done) {
        currentPB = new pushbulletStub();
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });

    describe('loading and settings', function() {
        it('loads', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"}];
            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                done();
            });
        });

        it('gets user info', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"}];
            var func = sinon.stub(currentPB, "me");
            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                func.yield(false, data.me);
                helper.getNode("n1").me.then(function(me) {
                    me.should.have.property("email", "john.doe@noma.il");
                    done();
                });
            });
        });

        it('gets user info, fail', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"},
                {id:"n3", type:"pushbullet in", config: "n1"}];
            var func = sinon.spy(currentPB, "me");
            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                var warn1 = sinon.spy(helper.getNode("n2"), "error");
                var warn2 = sinon.spy(helper.getNode("n3"), "error");
                func.yield(true, null);
                func.callCount.should.be.above(0);
                //helper.getNode("n1").me.should.have.property("email", "john.doe@noma.il");
                done();
            });
        });

        it('list devices', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"}];
            var func = sinon.stub(currentPB, "devices");
            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.request().get("/pushbullet/n1/devices").end(function(err, res) {
                    var devs = JSON.parse(res.text);
                    devs.should.have.length(2);
                    done();
                });

                var ret = getReply();
                ret.devices = data.devices;
                func.yields(false, ret);
            });
        });

        it('gets last modified', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"}];
            var func = sinon.stub(currentPB, "history");
            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                func.yield(false, getPushReply('modified'));
                helper.getNode("n1").last.then(function(last) {
                    last.should.equal(1234);
                    done();
                });
            });
        });

        it('gets last modified with no history', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"}];
            var func = sinon.stub(currentPB, "history");
            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                func.yield(false, getReply());
                helper.getNode("n1").last.then(function(last) {
                    last.should.equal(0);
                    done();
                });
            });
        });
    });

    describe('backward compatiblity', function() {
        it('should be valid', function(done) {
            var flow = [{"id": "n1", "type": "pushbullet", "chan": "", "title": "topic"},
                {id:"n3", type:"helper", wires: [["n1"]]}];
            helper.load(pushbulletNode, flow, {n1:{pushkey:"key", deviceid: "dev"}}, function() {
                var func = sinon.spy(currentPB, "note");
                helper.getNode("n3").send({
                    payload: "my note",
                });
                sinon.assert.calledWith(func, "dev", "topic", "my note");
                done();
            });
        });
    });

    describe('defaults and msg optionals', function() {
        it('defaults', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"},
                {id:"n3", type:"helper", wires: [["n2"]]}];
            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                var func = sinon.spy(currentPB, "note");
                helper.getNode("n3").send({
                    payload: "my note",
                });
                helper.getNode("n1").me.then(function(){
                    sinon.assert.calledWith(func, "john.doe@noma.il", "Node-RED", "my note");
                    done();
                });
            });
        });

        it('no overrides', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "note", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "note");
                helper.getNode("n3").send({
                    payload: "my note",
                });
                sinon.assert.calledWith(func, "id", "title", "my note");
                done();
            });
        });

        it('channel', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "note", title: "title", chan: "mychannel"},
                {id:"n3", type:"helper", wires: [["n2"]]}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "note");
                helper.getNode("n3").send({
                    payload: "my note",
                });
                sinon.assert.calledWith(func, {channel_tag: "mychannel"}, "title", "my note");
                done();
            });
        });

        it('channel from msg', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "note", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "note");
                helper.getNode("n3").send({
                    payload: "my note",
                    channel: "mychannel"
                });
                sinon.assert.calledWith(func, {channel_tag: "mychannel"}, "title", "my note");
                done();
            });
        });

        it('all optionals but defined in node', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "link", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "push");
                helper.getNode("n3").send({
                    deviceid: "over1",
                    topic: "over2",
                    pushtype: "note",
                    payload: "payload"
                });
                sinon.assert.calledWith(func, "id", {type: "link", body: undefined, title:"title", url: "payload"});
                done();
            });
        });

        it('all optionals', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "", title: ""},
                {id:"n3", type:"helper", wires: [["n2"]]}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "_msg_"}}, function() {
                var func = sinon.spy(currentPB, "push");
                helper.getNode("n3").send({
                    deviceid: "over1",
                    topic: "over2",
                    payload: "over3",
                    pushtype: "link"
                });
                sinon.assert.calledWith(func, "over1", {type: "link", body: undefined, title: "over2", url: "over3"});
                done();
            });
        });
    });

    describe('output', function() {
        it('note', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "note", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "note");
                helper.getNode("n3").send({
                    payload: "my note",
                });
                sinon.assert.calledWith(func, "id", "title", "my note");
                done();
            });
        });

        it('link', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "link", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "push");
                helper.getNode("n3").send({
                    payload: "http://link",
                    message: "message"
                });
                sinon.assert.calledWith(func, "id", {type: "link", title: "title", url: "http://link", body: "message"});
                done();
            });
        });

        it('list', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "list", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "list");
                helper.getNode("n3").send({
                    payload: ["a", "b", "c"],
                });
                sinon.assert.calledWith(func, "id", "title");
                func.getCall(0).args[2].should.have.length(3);

                done();
            });
        });

        it('list string', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "list", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "list");
                helper.getNode("n3").send({
                    payload: '["a", "b", "c"]',
                });
                sinon.assert.calledWith(func, "id", "title");
                func.getCall(0).args[2].should.have.length(3);

                done();
            });
        });

        it('address', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "address", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "address");
                helper.getNode("n3").send({
                    payload: "My Street 4",
                });
                sinon.assert.calledWith(func, "id", "title", "My Street 4");
                done();
            });
        });

        it('file', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "file", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "file");
                var fn = path.join(__dirname, "data.js")
                helper.getNode("n3").send({
                    payload: fn,
                });
                sinon.assert.calledWith(func, "id", fn, "title");
                done();
            });
        });

        it('should fail if file don\'t exist', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "file", title: "title"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "file");
                var errfn = sinon.spy(helper.getNode("n2"), "error");
                helper.getNode("n3").send({
                    payload: "hello",
                });
                func.called.should.fail;
                errfn.callCount.should.be.above(0);
                done();
            });
        });

        it('raw', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "push");
                helper.getNode("n3").send({
                    pushtype: '_raw_',
                    raw: {type: 'note', title: 'title', body: 'this is the note'}
                });
                sinon.assert.calledWith(func, "id", {type: 'note', title: 'title', body: 'this is the note'});
                done();
            });
        });

        it('raw update', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2: {deviceid: "id"}}, function() {
                var func = sinon.spy(currentPB, "updatePush");
                helper.getNode("n3").send({
                    pushtype: '_rawupdate_',
                    raw: {items: [{checked:false, text: 'a'}]},
                    data: {iden: 'id'}
                });
                sinon.assert.calledWith(func, "id", {items: [{checked:false, text: 'a'}]});
                done();
            });
        });
    });


    describe('actions', function() {
        it('delete', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "delete"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                var func = sinon.spy(currentPB, "deletePush");
                helper.getNode("n3").send({
                    payload: "my note",
                    data: { iden: "delid"}
                });
                sinon.assert.calledWith(func, "delid");
                done();
            });
        });

        it('dismiss', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "dismissal"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                var func = sinon.spy(currentPB, "updatePush");
                helper.getNode("n3").send({
                    payload: "my note",
                    data: { iden: "delid", dismissed: false }
                });
                sinon.assert.calledWith(func, "delid");
                done();
            });
        });

        it('update list', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet", config: "n1", pushtype: "updatelist"},
                {id:"n3", type:"helper", wires: [["n2"]]}
                ];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                var func = sinon.spy(currentPB, "updatePush");
                helper.getNode("n3").send({
                    payload: [{}, {}, {}],
                    data: { iden: "delid", type: "list" }
                });
                sinon.assert.calledWith(func, "delid");
                func.getCall(0).args[1].items.should.have.length(3);
                done();
            });
        });
    });

    describe('input', function() {
        it('handles stream push', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    done();
                });
                currentPB.streamEmitter.emit("message", {type: "push", push: {type: "clip", body: "clipboard"}})
            });
        });

        it('handles status', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                var func = sinon.spy(helper.getNode("n2"), 'status');
                currentPB.streamEmitter.emit("connect");
                currentPB.streamEmitter.emit("close");
                currentPB.streamEmitter.emit("error");
                func.callCount.should.equal(3);
                done();
            });
        });

        it('clipboard', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "clip");
                    msg.should.have.property("payload", "hello");
                    msg.should.have.property("data");
                    done();
                });
                currentPB.streamEmitter.emit("message", {type: "push", push: {type: "clip", body: "hello"}});
            });
        });

        it('mirror', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "mirror");
                    msg.should.have.property("payload", "If you see this on your computer, mirroring is working!\n");
                    msg.should.have.property("data");
                    done();
                });
                currentPB.streamEmitter.emit("message", {type: "push", push: data.mirror});
            });
        });

        it('dismissal', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "dismissal");
                    msg.should.have.property("payload", "pjgzwwocCCy");
                    msg.should.have.property("data");
                    done();
                });
                currentPB.streamEmitter.emit("message", {type: "push", push: data.dismissal});
            });
        });

        it('unknown type', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                var err = sinon.spy(helper.getNode("n1"), "error");
                currentPB.streamEmitter.emit("message", {type: "push", push: {type: "push", push: {type: "unknown", data: "test"}}});
                err.called.should.be.ok;
                done();
            });
        });
    });

    describe('tickle', function() {
        it('note', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "note");
                    msg.should.have.property("payload", "body");
                    msg.should.have.property("topic", "title");
                    msg.should.have.property("data");
                    done();
                });
                var func = sinon.stub(currentPB, "history");
                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                func.yields(false, getPushReply('note'));
            });
        });

        it('link', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "link");
                    msg.should.have.property("payload", "url");
                    msg.should.have.property("topic", "title");
                    msg.should.have.property("data");
                    done();
                });
                var func = sinon.stub(currentPB, "history");
                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                func.yields(false, getPushReply('link'));
            });
        });

        it('address', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "address");
                    msg.should.have.property("payload", "address");
                    msg.should.have.property("topic", "title");
                    msg.should.have.property("data");
                    done();
                });
                var func = sinon.stub(currentPB, "history");
                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                func.yields(false, getPushReply('address'));
            });
        });

        it('file', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "file");
                    msg.should.have.property("payload", "fileurl");
                    msg.should.have.property("topic", "filename");
                    msg.should.have.property("data");
                    done();
                });
                var func = sinon.stub(currentPB, "history");
                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                func.yields(false, getPushReply('file'));
            });
        });

        it('list', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "list");
                    msg.should.have.property("topic", "title");
                    msg.should.have.property("payload").with.length(3);
                    msg.should.have.property("data");
                    done();
                });
                var func = sinon.stub(currentPB, "history");
                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                func.yields(false, getPushReply('list'));
            });
        });

        it('delete', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "delete");
                    msg.should.have.property("payload", "pjgzwwocCCy");
                    msg.should.have.property("data");
                    done();
                });
                var func = sinon.stub(currentPB, "history");
                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                func.yields(false, getPushReply('delete'));
            });
        });

        it('dismissed', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}}, function() {
                helper.getNode("n3").on("input", function(msg) {
                    msg.should.have.property("pushtype", "dismissal");
                    msg.should.have.property("payload", "xXxXxXxXxXxsjArqXRsaZM");
                    msg.should.have.property("data");
                    done();
                });
                var func = sinon.stub(currentPB, "history");
                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                var rep = getPushReply('note');
                rep.pushes[0].dismissed = true;
                func.yields(false, rep);
            });
        });

        it('filter', function(done) {
            var flow = [{id:"n1", type:"pushbullet-config"},
                {id:"n2", type:"pushbullet in", config: "n1", wires: [["n3"]]},
                {id:"n3", type:"helper"}];

            helper.load(pushbulletNode, flow, {n1:{apikey:"invalid"}, n2:{filters:['a', 'b']}}, function() {
                var counter = sinon.spy();
                helper.getNode("n3").on("input", function(msg) {
                    counter();
                });

                var func = sinon.stub(currentPB, "history");

                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                var msg0 = getPushReply('link'); msg0.pushes[0].source_device_iden = 'a';
                func.onCall(0).yields(false, msg0);

                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                var msg1 = getPushReply('link'); msg1.pushes[0].source_device_iden = 'b';
                func.onCall(1).yields(false, msg1);

                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                var msg2 = getPushReply('link'); msg2.pushes[0].source_device_iden = 'c';
                func.onCall(2).yields(false, msg2);

                currentPB.streamEmitter.emit("message", {type: "tickle", subtype: "push"});
                var msg3 = getPushReply('link');
                delete msg3.pushes[0].source_device_iden;
                delete msg3.pushes[0].target_device_iden;
                func.onCall(3).yields(false, msg3);

                setTimeout(function() {
                    counter.callCount.should.equal(3);
                    done();
                }, 100);
            });
        });
    });
});
