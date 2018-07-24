
var should = require("should");
var helper = require('node-red-node-test-helper');
var testNode = require('../../../function/random/random.js');

describe('random node', function() {
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
        var flow = [{"id":"n1", "type":"random", "name":"random1", "wires":[[]]}];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            //console.log(n1);
            n1.should.have.property("low", 1);
            n1.should.have.property("high", 10);
            n1.should.have.property("inte", false);
            done();
        });
    });

    it('should output an integer between -3 and 3', function(done) {
        var flow = [{"id":"n1", "type":"random", low:-3, high:3, inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                if (c === 0) {
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.approximately(0,3);
                    msg.payload.toString().indexOf(".").should.equal(-1);
                    done();
                }
            });
            n1.emit("input", {payload:"a"});
        });
    });

    it('should output an float between 20 and 30', function(done) {
        var flow = [{"id":"n1", "type":"random", low:20, high:30, inte:false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                if (c === 0) {
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.approximately(25,5);
                    msg.payload.toString().indexOf(".").should.not.equal(-1);
                    done();
                }
            });
            n1.emit("input", {payload:"a"});
        });
    });

    it('should output an integer between -3 and 3 on chosen property - foo', function(done) {
        var flow = [{"id":"n1", "type":"random", property:"foo", low:-3, high:3, inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                if (c === 0) {
                    msg.should.have.a.property("foo");
                    msg.foo.should.be.approximately(0,3);
                    msg.foo.toString().indexOf(".").should.equal(-1);
                    done();
                }
            });
            n1.emit("input", {payload:"a"});
        });
    });

});
