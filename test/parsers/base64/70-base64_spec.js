
var should = require("should");
var helper = require('../../../test/helper.js');
var testNode = require('../../../parsers/base64/70-base64.js');

describe('base64 node', function() {
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
        var flow = [{"id":"n1", "type":"base64", "name":"base641", "wires":[[]]}];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name", "base641");
            done();
        });
    });

    it('should convert a Buffer to base64', function(done) {
        var flow = [{"id":"n1", "type":"base64", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload","QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=");
                done();
            });
            n1.emit("input", {payload: Buffer("ABCDEFGHIJKLMNOPQRSTUVWXYZ")});
        });
    });

    it('should convert base64 to a Buffer', function(done) {
        var flow = [{"id":"n1", "type":"base64", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.toString().should.equal("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                done();
            });
            n1.emit("input", {payload:"QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo="});
        });
    });

    it('should try to encode a non base64 string', function(done) {
        var flow = [{"id":"n1", "type":"base64", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.equal("QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=");
                done();
            });
            n1.emit("input", {payload:"ABCDEFGHIJKLMNOPQRSTUVWXYZ"});
        });
    });

    it('ignore msg with a boolean payload', function(done) {
        var flow = [{"id":"n1", "type":"base64", wires:[["n2"]] },
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
            n1.emit("input", {payload:true});
        });
    });

    it('ignore msg with a numeric payload', function(done) {
        var flow = [{"id":"n1", "type":"base64", wires:[["n2"]] },
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
            n1.emit("input", {payload:9999});
        });
    });

    it('ignore msg with an object payload', function(done) {
        var flow = [{"id":"n1", "type":"base64", wires:[["n2"]] },
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
            n1.emit("input", {payload:{A:1}});
        });
    });

    it('ignore msg with no payload', function(done) {
        var flow = [{"id":"n1", "type":"base64", wires:[["n2"]] },
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
