
var should = require("should");
var helper = require('../../../test/helper.js');
var testNode = require('../../../function/smooth/17-smooth.js');

describe('smooth node', function() {
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
        var flow = [{"id":"n1", "type":"smooth", "name":"smooth1", "wires":[[]]}];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name");
            n1.should.have.property("action");
            n1.should.have.property("count");
            done();
        });
    });

    it('should average over a number of inputs', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"mean", count:"5", round:"true", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
                if (c === 4) { msg.should.have.a.property("payload", 1.8); }
                if (c === 6) { msg.should.have.a.property("payload", 3); done(); }
            });
            n1.emit("input", {payload:1});
            n1.emit("input", {payload:1});
            n1.emit("input", {payload:2});
            n1.emit("input", {payload:3});
            n1.emit("input", {payload:4});
            n1.emit("input", {payload:4.786});
        });
    });

    it('should output max over a number of inputs', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"max", count:"5", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
                if (c === 2) { msg.should.have.a.property("payload", 5); }
                if (c === 3) { msg.should.have.a.property("payload", 5); }
                if (c === 5) { msg.should.have.a.property("payload", 7); done(); }
            });
            n1.emit("input", {payload:5});
            n1.emit("input", {payload:2});
            n1.emit("input", {payload:3});
            n1.emit("input", {payload:7});
            n1.emit("input", {payload:4});
        });
    });

    it('should output min over a number of inputs', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"min", count:"5", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
                if (c === 2) { msg.should.have.a.property("payload", 2); }
                if (c === 3) { msg.should.have.a.property("payload", 2); }
                if (c === 4) { msg.should.have.a.property("payload", 2); }
                if (c === 5) { msg.should.have.a.property("payload", 1); done(); }
            });
            n1.emit("input", {payload:5});
            n1.emit("input", {payload:2});
            n1.emit("input", {payload:3});
            n1.emit("input", {payload:7});
            n1.emit("input", {payload:1});
        });
    });

    it('should output standard deviation over a number of inputs', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"sd", count:"5", round:"3", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
                //console.log(c,msg);
                if (c === 2) { msg.should.have.a.property("payload", 0.707); }
                if (c === 3) { msg.should.have.a.property("payload", 1); }
                if (c === 4) { msg.should.have.a.property("payload", 1.291); }
                if (c === 5) { msg.should.have.a.property("payload", 1.581); done(); }
            });
            n1.emit("input", {payload:1});
            n1.emit("input", {payload:2});
            n1.emit("input", {payload:3});
            n1.emit("input", {payload:4});
            n1.emit("input", {payload:5});
        });
    });

    it('should do a low pass filter over a number of inputs', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"low", count:"5", round:"3", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
                if (c === 5) { msg.should.have.a.property("payload", 2.638); }
                if (c === 9) { msg.should.have.a.property("payload", 5.471); }
                if (c === 10) { msg.should.have.a.property("payload", 5.977); done(); }
            });
            n1.emit("input", {payload:1});
            n1.emit("input", {payload:2});
            n1.emit("input", {payload:3});
            n1.emit("input", {payload:4});
            n1.emit("input", {payload:5});
            n1.emit("input", {payload:6});
            n1.emit("input", {payload:7});
            n1.emit("input", {payload:8});
            n1.emit("input", {payload:8});
            n1.emit("input", {payload:8});
        });
    });

    it('should do a high pass filter over a number of inputs', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"high", count:"5", round:"3", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
                if (c === 5) { msg.should.have.a.property("payload", 2.362); }
                if (c === 9) { msg.should.have.a.property("payload", 2.529); }
                if (c === 10) { msg.should.have.a.property("payload", 2.023); done(); }
            });
            n1.emit("input", {payload:1});
            n1.emit("input", {payload:2});
            n1.emit("input", {payload:3});
            n1.emit("input", {payload:4});
            n1.emit("input", {payload:5});
            n1.emit("input", {payload:6});
            n1.emit("input", {payload:7});
            n1.emit("input", {payload:8});
            n1.emit("input", {payload:8});
            n1.emit("input", {payload:8});
        });
    });

    it('ignore msg with non numeric payload', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"mean", count:"5", round:"3", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                done("should not get here with no payload.");
            });
            setTimeout(function() {
                done();
            }, 50);
            n1.emit("input", {payload:"banana"});
        });
    });

    it('ignore msg with no payload', function(done) {
        var flow = [{"id":"n1", "type":"smooth", action:"mean", count:"5", round:"3", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                done("should not get here with no payload.");
            });
            setTimeout(function() {
                done();
            }, 50);
            n1.emit("input", {topic:1});
        });
    });

});
