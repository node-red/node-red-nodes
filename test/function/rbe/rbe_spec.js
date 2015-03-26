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
var testNode = require('../../../function/rbe/rbe.js');

describe('rbe node', function() {
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
        var flow = [{"id":"n1", "type":"rbe", "name":"rbe1", "wires":[[]]}];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name", "rbe1");
            n1.should.have.property("func", "rbe");
            n1.should.have.property("gap", 0);
            done();
        });
    });

    it('should only send output if payload changes', function(done) {
        var flow = [{"id":"n1", "type":"rbe", func:"rbe", gap:0, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                if (c === 0) {
                    msg.should.have.a.property("payload", "a");
                    c+=1;
                }
                else {
                    msg.should.have.a.property("payload", "b");
                    done();
                }
            });
            n1.emit("input", {payload:"a"});
            n1.emit("input", {payload:"a"});
            n1.emit("input", {payload:"a"});
            n1.emit("input", {payload:"a"});
            n1.emit("input", {payload:"a"});
            n1.emit("input", {payload:"b"});
            n1.emit("input", {payload:"b"});
        });
    });

    it('should only send output if more than x away from original value', function(done) {
        var flow = [{"id":"n1", "type":"rbe", func:"gap", gap:10, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                if (c === 0) {
                    msg.should.have.a.property("payload", 0);
                }
                else if (c === 1) {
                    msg.should.have.a.property("payload", 20);
                }
                else {
                    msg.should.have.a.property("payload", "5 deg");
                    done();
                }
                c += 1;
            });
            n1.emit("input", {payload:0});
            n1.emit("input", {payload:2});
            n1.emit("input", {payload:4});
            n1.emit("input", {payload:"6 deg"});
            n1.emit("input", {payload:8});
            n1.emit("input", {payload:20});
            n1.emit("input", {payload:15});
            n1.emit("input", {payload:"5 deg"});
        });
    });

    it('should warn if no number found in gap mode', function(done) {
        var flow = [{"id":"n1", "type":"rbe", func:"gap", gap:10, wires:[["n2"]] },
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
                    return evt[0].type == "rbe";
                });
                logEvents.should.have.length(1);
                var msg = logEvents[0][0];
                msg.should.have.property('level', helper.log().WARN);
                msg.should.have.property('id', 'n1');
                msg.should.have.property('type', 'rbe');
                msg.should.have.property('msg', 'no number found in payload');
                done();
            },50);
            n1.emit("input", {payload:"banana"});
        });
    });

});
