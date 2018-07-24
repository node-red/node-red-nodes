
var should = require("should");
var helper = require("node-red-node-test-helper");
var testNode = require('../../../parsers/msgpack/70-msgpack.js');

describe('msgpack node', function() {
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
        var flow = [{"id":"n1", "type":"msgpack", "name":"msgpack1", "wires":[[]]}];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name", "msgpack1");
            done();
        });
    });

    var buf;

    it('should pack an object', function(done) {
        var flow = [{"id":"n1", "type":"msgpack", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.be.a.Object;
                msg.payload.should.have.length(43);
                buf = msg.payload;
                done();
            });
            n1.emit("input", {payload:{A:1, B:"string", C:true, D:[1,true,"string"], E:{Y:9,Z:"string"}}});
        });
    });

    it('should unpack a Buffer', function(done) {
        var flow = [{"id":"n1", "type":"msgpack", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.have.a.property("A",1);
                msg.payload.should.have.a.property("B",'string');
                msg.payload.should.have.a.property("C",true);
                msg.payload.should.have.a.property("D",[1,true,"string"]);
                msg.payload.should.have.a.property("E");
                msg.payload.E.should.have.a.property("Y",9);
                msg.payload.E.should.have.a.property("Z","string");
                done();
            });
            n1.emit("input", {payload:buf});
        });
    });

    it('should error if the buffer fails to decode', function(done) {
        buf[0] = 0x87;
        var flow = [{"id":"n1", "type":"msgpack", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                done("should not get here if there is an error.");
            });
            setTimeout(function() {
                done();
            }, 25);
            n1.emit("input", {payload:buf});
        });
    });

    it('ignore msg with no payload', function(done) {
        var flow = [{"id":"n1", "type":"msgpack", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                done("should not get here with no payload.");
            });
            setTimeout(function() {
                done();
            }, 25);
            n1.emit("input", {topic:1});
        });
    });

});
