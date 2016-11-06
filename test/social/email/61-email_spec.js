
var should = require("should");
var sinon = require("sinon");
var helper = require('../../../test/helper.js');
var emailNode = require('../../../social/email/61-email.js');

describe('email Node', function() {

    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });

    describe('email in', function() {

        it('should load with defaults', function(done) {
            var flow = [ { id:"n1", type:"e-mail in", name:"emailin", wires:[[]] } ];
            helper.load(emailNode, flow, function() {
                var n1 = helper.getNode("n1");
                n1.should.have.property('name',  "emailin");
                n1.should.have.property("repeat", 300000);
                n1.should.have.property("inserver", "imap.gmail.com");
                n1.should.have.property("inport", "993");
                done();
            });
        });

        //it('should load', function(done) {
            //var flow = [ { id:"n1", type:"e-mail in", wires:[["n2"]] },
                    //{id:"n2", type:"helper"} ];
            //helper.load(emailNode, flow, function() {
                //var n1 = helper.getNode("n1");
                //var n2 = helper.getNode("n2");
                //n2.on("input", function(msg) {
                    //msg.should.have.property('payload',  "hello");
                    //done();
                //});
                //var testString = "1,2,3,4"+String.fromCharCode(10);
                //n1.emit("input", {payload:testString});
            //});
        //});

    });

    describe('email out', function() {

        it('should load with defaults', function(done) {
            var flow = [ { id:"n1", type:"e-mail", name:"emailout", wires:[[]] } ];
            helper.load(emailNode, flow, function() {
                var n1 = helper.getNode("n1");
                n1.should.have.property('name',  "emailout");
                done();
            });
        });

        it('should fail to send an email (no valid creds)', function(done) {
            var smtpTransport = require("nodemailer").createTransport();
            //var spy = sinon.stub(smtpTransport, 'sendMail', function(arg1,arg2,arg3,arg4) {
                //console.log("HELLO");
                //console.log(arg1,arg2,arg3,arg4);
                //done();
            //});
            var flow = [ { id:"n1", type:"e-mail", name:"emailout", outserver:"smtp.gmail.com", outport:"465", wires:[[]] } ];
            helper.load(emailNode, flow, function() {
                var n1 = helper.getNode("n1");
                n1.should.have.property('name',  "emailout");
                n1.emit("input", {payload:"Hello World"});
                //done();
            });
            setTimeout(function() {
                try {
                    var logEvents = helper.log().args.filter(function(evt) {
                        return evt[0].type == "e-mail";
                    });
                    //console.log(logEvents);
                    //logEvents.should.have.length(3);
                    logEvents[0][0].should.have.a.property('msg');
                    logEvents[0][0].msg.toString().should.startWith("email.errors.nouserid");
                    done();
                }
                catch(e) { done(e); }
                //finally { smtpTransport.sendMail.restore(); }
            }, 1000);
        })

    });
});
