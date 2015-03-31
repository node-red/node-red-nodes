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
            n1.should.have.property("low", 1);
            n1.should.have.property("high", 10);
            n1.should.have.property("inte", false);
            done();
        });
    });

    it('should output an integer between -3 and 3', function(done) {
        var flow = [{"id":"n1", "type":"random", low:3, high:3, inte:true, wires:[["n2"]] },
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

});
