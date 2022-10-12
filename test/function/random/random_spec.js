
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

// ============================================================

   it ("Test i1 (integer) - DEFAULT no overrides defaults to 1 and 10", function(done) {
        var flow = [{id:"n1", type:"random", low: "" , high:"" , inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(1,10);
                    msg.payload.toString().indexOf(".").should.equal(-1); // see if it's really an integer and not a float...
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i1"});
        });
    });

   it ("Test f1 (float)   - DEFAULT no overrides defaults to 1 and 10", function(done) {
        var flow = [{id:"n1", type:"random", low:"" , high:"" , inte:false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(1.0,9.999);
                    //msg.payload.toString().indexOf(".").should.not.equal(-1);
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test f-1"});
        });
    });

// ============================================================

   it ("Test i2 (integer) - FLIP node From = 3 To = -3", function(done) {
        var flow = [{id:"n1", type:"random", low: 3, high: -3, inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(-3,3);
                    msg.payload.toString().indexOf(".").should.equal(-1); // slightly dumb test to see if it really is an integer and not a float...
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i2"});
        });
    });

   it ("Test f2 (float)   - FLIP node From = 3 To = -3", function(done) {
        var flow = [{id:"n1", type:"random", low: 3, high: -3, inte:false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(-3.0,3.0);
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test f2"});
        });
    });

// ============================================================

   it ("Test i3 (integer) - values in msg From = 2 To = '5', node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(2,5);
                    msg.payload.toString().indexOf(".").should.equal(-1); // slightly dumb test to see if it really is an integer and not a float...
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i3", "from":2, "to":'5'});
        });
    });

   it ("Test f3 (float)   - values in msg From = 2 To = '5', node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(2.0,5.0);
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test f3", "from":2, "to":'5'});
        });
    });


 // ============================================================

  it ("Test i4 (integer) - value in msg From = 2, node From = 5 To = '' - node overides From = 5 To defaults to 10", function(done) {
        var flow = [{id:"n1", type:"random", low: 5, high:"", inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(5,10);
                    msg.payload.toString().indexOf(".").should.equal(-1);
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i4", "from": 2});
        });
    });

  it ("Test f4 (float)   - value in msg From = 2, node From = 5 To = '' - node wins 'To' defaults to 10", function(done) {
        var flow = [{id:"n1", type:"random", low: 5, high:"", inte:false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(5.0,10.0);
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test f4", "from": 2});
        });
    });

// ============================================================

  it ("Test i5 (integer) - msg From = '6' To = '9' node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(6,9);
                    msg.payload.toString().indexOf(".").should.equal(-1); // slightly dumb test to see if it really is an integer and not a float...
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i5", "from": '6', "to": '9'});
        });
    });

    it ("Test i5a (integer) - msg From = '0' To = '2' node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(0,2);
                    msg.payload.toString().indexOf(".").should.equal(-1); // slightly dumb test to see if it really is an integer and not a float...
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i5", "from": '0', "to": '2'});
        });
    });

    it ("Test i5b (integer) - msg From = '-3' To = '0' node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(-3,0);
                    msg.payload.toString().indexOf(".").should.equal(-1); // slightly dumb test to see if it really is an integer and not a float...
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i5", "from": '-3', "to": '0'});
        });
    });

  it ("Test f5 (float)   - msg From = '6' To = '9' node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(6.0,9.0);
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test f5", "from": '6', "to": '9'});
        });
    });

// ============================================================

  it ("Test i6 (integer) - msg From = 2.4 To = '7.3' node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:true, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(2,7);
                    msg.payload.toString().indexOf(".").should.equal(-1); // slightly dumb test to see if it really is an integer and not a float...
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test i6", "from": 2.4, "to": '7.3'});
        });
    });

  it ("Test f6 (float)   - msg From = 2.4 To = '7.3' node no entries", function(done) {
        var flow = [{id:"n1", type:"random", low: "", high: "", inte:false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(testNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    //console.log(msg);
                    msg.should.have.a.property("payload");
                    msg.payload.should.be.within(2.4,7.3);
                    done();
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {"test":"Test f6", "from": 2.4, "to": '7.3'});
        });
    });

// ============================================================



});
