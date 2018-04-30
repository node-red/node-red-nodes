var should = require("should");
var sinon = require("sinon");
var helper = require("node-red-node-test-helper");
var emailNode = require('../../../social/email/61-email.js');

describe('email Node', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    describe('email in', function () {

        it('should load with defaults', function (done) {
            var flow = [{
                id: "n1",
                type: "e-mail in",
                name: "emailin",
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                n1.should.have.property('name', "emailin");
                n1.should.have.property("repeat", 300000);
                n1.should.have.property("inserver", "imap.gmail.com");
                n1.should.have.property("inport", "993");
                done();
            });
        });
    });

    describe('email out', function () {

        it('should load with defaults', function (done) {
            var flow = [{
                id: "n1",
                type: "e-mail",
                name: "emailout",
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                n1.should.have.property('name', "emailout");
                done();
            });
        });

        it('should fail with no payload', function (done) {
            var flow = [{
                id: "n1",
                type: "e-mail",
                name: "emailout",
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                n1.credentials = {
                    userid: "test",
                    password: "test",
                };
                n1.emit("input", {});
                //done();
            });
            setTimeout(function () {
                try {
                    var logEvents = helper.log().args.filter(function (evt) {
                        //console.log(evt[0].msg);
                        return evt[0].type == "e-mail";
                    });
                    //console.log(helper.log().args);
                    //console.log(helper.log());
                    //logEvents.should.have.length(3);
                    logEvents[0][0].should.have.a.property('msg');
                    logEvents[0][0].msg.toString().should.startWith("email.errors.nopayload");
                    done();
                } catch (e) {
                    done(e);
                }
                //finally { smtpTransport.sendMail.restore(); }
            }, 1500);
        });

        it('should fail to send an email (invalid creds)', function (done) {
            //var smtpTransport = require("nodemailer").createTransport();
            //var spy = sinon.stub(smtpTransport, 'sendMail', function(arg1,arg2,arg3,arg4) {
            //console.log("HELLO");
            //console.log(arg1,arg2,arg3,arg4);
            //done();
            //});
            var flow = [{
                id: "n1",
                type: "e-mail",
                name: "test@gmail.com",
                server: "smtp.gmail.com",
                secure: true,
                port: "465",
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                n1.credentials = {
                    userid: "test",
                    password: "test",
                };
                n1.should.have.property('name', "test@gmail.com");
                n1.emit("input", {
                    payload: "Hello World",
                    to: "test@gmail.com"
                });
                //done();
            });
            setTimeout(function () {
                try {
                    var logEvents = helper.log().args.filter(function (evt) {
                        //console.log(evt[0].msg);
                        return evt[0].type == "e-mail";
                    });
                    // console.log(helper.log().args);
                    // console.log(helper.log());
                    // console.log(logEvents[0][0].msg.toString());
                    //logEvents.should.have.length(3);
                    logEvents[0][0].should.have.a.property('msg');
                    logEvents[0][0].msg.toString().should.startWith("Error:");
                    done();
                } catch (e) {
                    done(e);
                }
                //finally { smtpTransport.sendMail.restore(); }
            }, 1900);
        })

        it('should fail to send an email (no creds provided)', function (done) {
            //var smtpTransport = require("nodemailer").createTransport();
            //var spy = sinon.stub(smtpTransport, 'sendMail', function(arg1,arg2,arg3,arg4) {
            //console.log("HELLO");
            //console.log(arg1,arg2,arg3,arg4);
            //done();
            //});
            var flow = [{
                id: "n1",
                type: "e-mail",
                name: "test@gmail.com",
                server: "smtp.gmail.com",
                secure: true,
                port: "465",
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                n1.should.have.property('name', "test@gmail.com");
                n1.emit("input", {
                    payload: "Hello World",
                    to: "test@gmail.com"
                });
                //done();
            });
            setTimeout(function () {
                try {
                    var logEvents = helper.log().args.filter(function (evt) {
                        //console.log(evt[0].msg);
                        return evt[0].type == "e-mail";
                    });
                    //console.log(helper.log().args);
                    //logEvents.should.have.length(3);
                    logEvents[0][0].should.have.a.property('msg');
                    logEvents[0][0].msg.toString().should.startWith("Error:");
                    done();
                } catch (e) {
                    done(e);
                }
                //finally { smtpTransport.sendMail.restore(); }
            }, 1900);
        })

    });
});
