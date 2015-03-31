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

var should = require("should");
var helper = require('../../../test/helper.js');
var testNode = require('../../../parsers/geohash/70-geohash.js');

describe('geohash node', function() {
    "use strict";

    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload().then(function() {
            helper.stopServer(done);
        });
    });

    it("should be loaded with correct defaults", function(done) {
        var flow = [{"id":"n1", "type":"geohash", "name":"geohash1", "wires":[[]]}];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name", "geohash1");
            done();
        });
    });

    it('should convert payload lat,lon to geohash', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"geohash", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload", "gcnfju78x");
                done();
            });
            n1.emit("input", {payload:"51.0,-1.5"});
        });
    });

    it('should convert payload lat,lon > 90/180 to geohash', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"geohash", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload", "gzyzvzgxz");
                done();
            });
            n1.emit("input", {payload:"231.0,358.5"});
        });
    });

    it('should convert payload lat,lon < -90/-180 to geohash', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"geohash", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload", "5bnbjb58p");
                done();
            });
            n1.emit("input", {payload:"-100,-361.5"});
        });
    });

    it('should convert payload object lat,lon to geohash', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"geohash", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.have.a.property("geohash", "t9cbbukqn");
                done();
            });
            n1.emit("input", {payload:{latitude:10,longitude:70}});
        });
    });

    it('should convert payload geohash to lat.lon', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"geohash", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.have.a.property("lat", 51.00002);
                msg.payload.should.have.a.property("lon", -1.5);
                msg.payload.should.have.a.property("error");
                done();
            });
            n1.emit("input", {payload:"gcnfju78x"});
        });
    });

    it('should convert location lat, lon to geohash', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"geohash", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("location");
                msg.location.should.have.a.property("geohash", "kukqnpp5e");
                done();
            });
            n1.emit("input", {location:{lat:-20,lon:40}});
        });
    });

    it('should convert location geohash to lat.lon', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"geohash", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("location");
                msg.location.should.have.a.property("lat", -19.99999);
                msg.location.should.have.a.property("lon", 40);
                msg.location.should.have.a.property("error");
                done();
            });
            n1.emit("input", {location:{geohash:"kukqnpp5e"}});
        });
    });

    it('should warn if given a duff string', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"gap", gap:10, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
            });
            setTimeout( function() {
                c.should.equal(0);
                helper.log().called.should.be.true;
                var logEvents = helper.log().args.filter(function (evt) {
                    return evt[0].type == "geohash";
                });
                logEvents.should.have.length(1);
                var msg = logEvents[0][0];
                msg.should.have.property('level', helper.log().WARN);
                msg.should.have.property('id', 'n1');
                msg.should.have.property('type', 'geohash');
                msg.should.have.property('msg', 'Unexpected string format - should either be lat,lon or geohash');
                done();
            },50);
            n1.emit("input", {payload:"bananas is nice"});
        });
    });

    it('should warn if given a non numeric pair of numbers', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"gap", gap:10, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                console.log(msg);
                c += 1;
            });
            setTimeout( function() {
                c.should.equal(0);
                helper.log().called.should.be.true;
                var logEvents = helper.log().args.filter(function (evt) {
                    return evt[0].type == "geohash";
                });
                logEvents.should.have.length(1);
                var msg = logEvents[0][0];
                msg.should.have.property('level', helper.log().WARN);
                msg.should.have.property('id', 'n1');
                msg.should.have.property('type', 'geohash');
                msg.should.have.property('msg', 'Incorrect string format - should be lat,lon');
                done();
            },50);
            n1.emit("input", {payload:"bananas,apples"});
        });
    });

    it('should warn if given a string with wrong number of parts', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"gap", gap:10, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
            });
            setTimeout( function() {
                c.should.equal(0);
                helper.log().called.should.be.true;
                var logEvents = helper.log().args.filter(function (evt) {
                    return evt[0].type == "geohash";
                });
                logEvents.should.have.length(1);
                var msg = logEvents[0][0];
                msg.should.have.property('level', helper.log().WARN);
                msg.should.have.property('id', 'n1');
                msg.should.have.property('type', 'geohash');
                msg.should.have.property('msg', 'Unexpected string format - should be lat,lon');
                done();
            },50);
            n1.emit("input", {payload:"bananas,apples,pears"});
        });
    });

    it('should warn if not string or object', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"gap", gap:10, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
            });
            setTimeout( function() {
                c.should.equal(0);
                helper.log().called.should.be.true;
                var logEvents = helper.log().args.filter(function (evt) {
                    return evt[0].type == "geohash";
                });
                logEvents.should.have.length(1);
                var msg = logEvents[0][0];
                msg.should.have.property('level', helper.log().WARN);
                msg.should.have.property('id', 'n1');
                msg.should.have.property('type', 'geohash');
                msg.should.have.property('msg', 'This node only expects strings or objects.');
                done();
            },50);
            n1.emit("input", {payload:42});
        });
    });

    it('should warn if location object with only a lat (or lon)', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"gap", gap:10, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
            });
            setTimeout( function() {
                c.should.equal(0);
                helper.log().called.should.be.true;
                var logEvents = helper.log().args.filter(function (evt) {
                    return evt[0].type == "geohash";
                });
                logEvents.should.have.length(1);
                var msg = logEvents[0][0];
                msg.should.have.property('level', helper.log().WARN);
                msg.should.have.property('id', 'n1');
                msg.should.have.property('type', 'geohash');
                msg.should.have.property('msg', 'lat or lon missing from msg.location');
                done();
            },50);
            n1.emit("input", {location:{lat:-20}});
        });
    });

    it('should warn if payload object with only a lat (or lon)', function(done) {
        var flow = [{"id":"n1", "type":"geohash", func:"gap", gap:10, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
            });
            setTimeout( function() {
                c.should.equal(0);
                helper.log().called.should.be.true;
                var logEvents = helper.log().args.filter(function (evt) {
                    return evt[0].type == "geohash";
                });
                logEvents.should.have.length(1);
                var msg = logEvents[0][0];
                msg.should.have.property('level', helper.log().WARN);
                msg.should.have.property('id', 'n1');
                msg.should.have.property('type', 'geohash');
                msg.should.have.property('msg', 'lat or lon missing from msg.payload');
                done();
            },50);
            n1.emit("input", {payload:{lon:40}});
        });
    });

});
