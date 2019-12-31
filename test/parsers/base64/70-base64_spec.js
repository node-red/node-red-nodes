
var should = require("should");
var helper = require("node-red-node-test-helper");
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
            n1.emit("input", {payload: Buffer.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ")});
        });
    });

    it('should convert a Buffer to base64 using another property - foo', function(done) {
        var flow = [{id:"n1", type:"base64", property:"foo", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("foo","QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=");
                done();
            });
            n1.emit("input", {foo: Buffer.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ")});
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
                msg.payload.should.be.instanceof(Buffer);
                msg.payload.toString().should.equal("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                done();
            });
            n1.emit("input", {payload:"QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo="});
        });
    });

    it('should convert base64 to a Buffer using another property - foo', function(done) {
        var flow = [{id:"n1", type:"base64", property:"foo", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("foo");
                msg.foo.should.be.instanceof(Buffer);
                msg.foo.toString().should.equal("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                done();
            });
            n1.emit("input", {foo:"QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo="});
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

    it('can force encode string to base64', function(done) {
        var flow = [{id:"n1", type:"base64", action:"str", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload","YW5keQ==");
                done();
            });
            n1.emit("input", {payload:"andy"});
        });
    });

    it('can force encode boolean to base64', function(done) {
        var flow = [{id:"n1", type:"base64", action:"str", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload","dHJ1ZQ==");
                done();
            });
            n1.emit("input", {payload:true});
        });
    });

    it('can force encode number to base64', function(done) {
        var flow = [{id:"n1", type:"base64", action:"str", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload","MTIzNA==");
                done();
            });
            n1.emit("input", {payload:1234});
        });
    });

    it('can force encode object to base64', function(done) {
        var flow = [{id:"n1", type:"base64", action:"str", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.a.property("payload","eyJhIjoxfQ==");
                done();
            });
            n1.emit("input", {payload:{a:1}});
        });
    });

    it('can force decode base64 to string', function(done) {
        var flow = [{id:"n1", type:"base64", action:"b64", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.payload.should.be.instanceof(String);
                msg.should.have.a.property("payload","Hello World");
                done();
            });
            n1.emit("input", {payload:"SGVsbG8gV29ybGQ="});
        });
    });

    it('wont decode base64 to string if not a valid string', function(done) {
        var flow = [{id:"n1", type:"base64", action:"b64", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                done("should not get here with no payload.");
            });
            setTimeout(function () {
                try {
                    var logEvents = helper.log().args.filter(function (evt) {
                        return evt[0].type == "base64";
                    });
                    logEvents[0][0].should.have.a.property('msg');
                    logEvents[0][0].msg.toString().should.startWith("base64.error.invalid");
                    done();
                } catch (e) {
                    done(e);
                }
            }, 45);
            n1.emit("input", {payload:"andy!@3"});
        });
    });

    it('wont decode base64 to string if not a string', function(done) {
        var flow = [{id:"n1", type:"base64", action:"b64", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                done("should not get here with no payload.");
            });
            setTimeout(function () {
                try {
                    var logEvents = helper.log().args.filter(function (evt) {
                        return evt[0].type == "base64";
                    });
                    logEvents[0][0].should.have.a.property('msg');
                    logEvents[0][0].msg.toString().should.startWith("base64.error.nonbase64");
                    done();
                } catch (e) {
                    done(e);
                }
            }, 45);
            n1.emit("input", {payload:1234});
        });
    });

});
