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
                n1.should.have.property("authtype", "BASIC");
                done();
            });
        });

        it('should force input on XOAuth2', function (done) {
            var flow = [{
                id: "n1",
                type: "e-mail in",
                name: "emailin",
                authtype: "XOAUTH2",
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                n1.should.have.property("repeat", 0);
                n1.should.have.property("inputs", 1);
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
                port: 1025,
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                n1.should.have.property('name', "emailout");
                n1.should.have.property("authtype", "BASIC");
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
                    logEvents[2][0].msg.toString().should.startWith("email.errors.nopayload");
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
                    logEvents[2][0].msg.toString().should.startWith("Error:");
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
                    logEvents[2][0].msg.toString().should.startWith("Error:");
                    done();
                } catch (e) {
                    done(e);
                }
                //finally { smtpTransport.sendMail.restore(); }
            }, 1900);
        })

    });

    describe('email mta', function () {

        it('should catch an email send to localhost 1025', function (done) {
            var flow = [{
                id: "n1",
                type: "e-mail mta",
                name: "emailmta",
                port: 1025,
                wires: [
                    ["n2"]
                ]
            },
            {
                id:"n2",
                type:"helper"
            },
            {
                id: "n3",
                type: "e-mail",
                dname: "testout",
                server: "localhost",
                secure: false,
                port: 1025,
                wires: [
                    []
                ]
            }];
            helper.load(emailNode, flow, function () {
                var n1 = helper.getNode("n1");
                var n2 = helper.getNode("n2");
                var n3 = helper.getNode("n3");
                n1.should.have.property('port', 1025);

                n2.on("input", function(msg) {
                    //console.log("GOT",msg);
                    try {
                        msg.should.have.a.property("payload",'Hello World\n');
                        msg.should.have.a.property("topic","Test");
                        msg.should.have.a.property("from",'foo@example.com');
                        msg.should.have.a.property("to",'bar@example.com');
                        msg.should.have.a.property("attachments");
                        msg.should.have.a.property("header");
                        done();
                    }
                    catch(e) {
                        done(e)
                    }
                });

                n3.emit("input", {
                    payload: "Hello World",
                    topic: "Test",
                    from: "foo@example.com",
                    to: "bar@example.com"
                });
                //done();
            });
        });
    });
});
