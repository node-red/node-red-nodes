
var should = require("should");
var helper = require("node-red-node-test-helper");
var testNode = require('../../../parsers/markdown/70-markdown.js');

describe('markdown node', function() {
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
        var flow = [{"id":"n1", "type":"markdown", "name":"markdown1", "wires":[[]]}];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name", "markdown1");
            done();
        });
    });

    var buf;

    it('should convert a string to html', function(done) {
        var flow = [{"id":"n1", "type":"markdown", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.be.a.String;
                msg.payload.should.equal('<p><strong>BOLD</strong> <em>italic</em></p>\n<hr>\n<p>™\n<code>code</code></p>\n');
                done();
            });
            n1.emit("input", {payload:"**BOLD** *italic*\n***\n\n(TM)\n`code`"});
        });
    });

    it('should ignore other types - object', function(done) {
        var flow = [{"id":"n1", "type":"markdown", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.be.a.Object;
                msg.payload.a.should.equal("object");
                done();
            });
            n1.emit("input", {payload:{a:"object"}});
        });
    });

    it('should ignore other types - number', function(done) {
        var flow = [{"id":"n1", "type":"markdown", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.be.a.number;
                msg.payload.should.equal(1);
                done();
            });
            n1.emit("input", {payload:1});
        });
    });

    it('should ignore other types - boolean', function(done) {
        var flow = [{"id":"n1", "type":"markdown", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.be.a.boolean;
                msg.payload.should.equal(true);
                done();
            });
            n1.emit("input", {payload:true});
        });
    });

    it('should ignore other types - array', function(done) {
        var flow = [{"id":"n1", "type":"markdown", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload");
                msg.payload.should.be.an.object;
                done();
            });
            n1.emit("input", {payload:[1,2,"a","b"]});
        });
    });

});
