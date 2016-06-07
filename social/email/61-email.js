/**
 * Copyright 2013, 2016 IBM Corp.
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

/**
 * POP3 protocol - RFC1939 - https://www.ietf.org/rfc/rfc1939.txt
 *
 * Dependencies:
 * * poplib     - https://www.npmjs.com/package/poplib
 * * nodemailer - https://www.npmjs.com/package/nodemailer
 * * imap       - https://www.npmjs.com/package/imap
 * * mailparser - https://www.npmjs.com/package/mailparser
 */

module.exports = function(RED) {
    "use strict";
    var nodemailer = require("nodemailer");
    var Imap = require('imap');
    var mimelib = require('mimelib');
    var POP3Client = require("poplib");
    var MailParser = require("mailparser").MailParser;
    var util = require("util");

    try {
        var globalkeys = RED.settings.email || require(process.env.NODE_RED_HOME + "/../emailkeys.js");
    } catch (err) {}

    function EmailNode(n) {
        RED.nodes.createNode(this, n);
        this.topic = n.topic;
        this.name = n.name;
        this.outserver = n.server;
        this.outport = n.port;
        var flag = false;
        if (this.credentials && this.credentials.hasOwnProperty("userid")) {
            this.userid = this.credentials.userid;
        } else {
            if (globalkeys) {
                this.userid = globalkeys.user;
                flag = true;
            } else {
                this.error(RED._("email.errors.nouserid"));
            }
        }
        if (this.credentials && this.credentials.hasOwnProperty("password")) {
            this.password = this.credentials.password;
        } else {
            if (globalkeys) {
                this.password = globalkeys.pass;
                flag = true;
            } else {
                this.error(RED._("email.errors.nopassword"));
            }
        }
        if (flag) {
            RED.nodes.addCredentials(n.id, {
                userid: this.userid,
                password: this.password,
                global: true
            });
        }
        var node = this;

        var smtpTransport = nodemailer.createTransport({
            host: node.outserver,
            port: node.outport,
            secure: true,
            auth: {
                user: node.userid,
                pass: node.password
            }
        });

        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload")) {
                if (smtpTransport) {
                    node.status({
                        fill: "blue",
                        shape: "dot",
                        text: "email.status.sending"
                    });
                    if (msg.to && node.name && (msg.to !== node.name)) {
                        node.warn(RED._("node-red:common.errors.nooverride"));
                    }
                    var sendopts = {
                        from: node.userid
                    }; // sender address
                    sendopts.to = node.name || msg.to; // comma separated list of addressees
                    if (node.name === "") {
                        sendopts.cc = msg.cc;
                        sendopts.bcc = msg.bcc;
                    }
                    sendopts.subject = msg.topic || msg.title || "Message from Node-RED"; // subject line
                    if (msg.hasOwnProperty("envelope")) {
                        sendopts.envelope = msg.envelope;
                    }
                    if (Buffer.isBuffer(msg.payload)) { // if it's a buffer in the payload then auto create an attachment instead
                        if (!msg.filename) {
                            var fe = "bin";
                            if ((msg.payload[0] === 0xFF) && (msg.payload[1] === 0xD8)) {
                                fe = "jpg";
                            }
                            if ((msg.payload[0] === 0x47) && (msg.payload[1] === 0x49)) {
                                fe = "gif";
                            } //46
                            if ((msg.payload[0] === 0x42) && (msg.payload[1] === 0x4D)) {
                                fe = "bmp";
                            }
                            if ((msg.payload[0] === 0x89) && (msg.payload[1] === 0x50)) {
                                fe = "png";
                            } //4E
                            msg.filename = "attachment." + fe;
                        }
                        sendopts.attachments = [{
                            content: msg.payload,
                            filename: (msg.filename.replace(/^.*[\\\/]/, '') || "file.bin")
                        }];
                        if (msg.hasOwnProperty("headers") && msg.headers.hasOwnProperty("content-type")) {
                            sendopts.attachments[0].contentType = msg.headers["content-type"];
                        }
                        // Create some body text..
                        sendopts.text = RED._("email.default-message", {
                            filename: (msg.filename.replace(/^.*[\\\/]/, '') || "file.bin"),
                            description: (msg.hasOwnProperty("description") ? "\n\n" + msg.description : "")
                        });
                    } else {
                        var payload = RED.util.ensureString(msg.payload);
                        sendopts.text = payload; // plaintext body
                        if (/<[a-z][\s\S]*>/i.test(payload)) {
                            sendopts.html = payload;
                        } // html body
                        if (msg.attachments) {
                            sendopts.attachments = msg.attachments;
                        } // add attachments
                    }
                    smtpTransport.sendMail(sendopts, function(error, info) {
                        if (error) {
                            node.error(error, msg);
                            node.status({
                                fill: "red",
                                shape: "ring",
                                text: "email.status.sendfail"
                            });
                        } else {
                            node.log(RED._("email.status.messagesent", {
                                response: info.response
                            }));
                            node.status({});
                        }
                    });
                } else {
                    node.warn(RED._("email.errors.nocredentials"));
                }
            } else {
                node.warn(RED._("email.errors.nopayload"));
            }
        });
    }
    RED.nodes.registerType("e-mail", EmailNode, {
        credentials: {
            userid: {
                type: "text"
            },
            password: {
                type: "password"
            },
            global: {
                type: "boolean"
            }
        }
    });



    //
    // EmailInNode
    //
    // Setup the EmailInNode
    function EmailInNode(n) {
        var imap;

        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.repeat = n.repeat * 1000 || 300000;
        this.inserver = n.server || (globalkeys && globalkeys.server) || "imap.gmail.com";
        this.inport = n.port || (globalkeys && globalkeys.port) || "993";
        this.box = n.box || "INBOX";
        this.useSSL = n.useSSL;
        this.protocol = n.protocol || "IMAP";
        this.disposition = n.disposition || "None"; // "None", "Delete", "Read"

        var flag = false;

        if (this.credentials && this.credentials.hasOwnProperty("userid")) {
            this.userid = this.credentials.userid;
        } else {
            if (globalkeys) {
                this.userid = globalkeys.user;
                flag = true;
            } else {
                this.error(RED._("email.errors.nouserid"));
            }
        }
        if (this.credentials && this.credentials.hasOwnProperty("password")) {
            this.password = this.credentials.password;
        } else {
            if (globalkeys) {
                this.password = globalkeys.pass;
                flag = true;
            } else {
                this.error(RED._("email.errors.nopassword"));
            }
        }
        if (flag) {
            RED.nodes.addCredentials(n.id, {
                userid: this.userid,
                password: this.password,
                global: true
            });
        }

        var node = this;
        this.interval_id = null;

        // Process a new email message by building a Node-RED message to be passed onwards
        // in the message flow.  The parameter called `msg` is the template message we
        // start with while `mailMessage` is an object returned from `mailparser` that
        // will be used to populate the email.
        function processNewMessage(msg, mailMessage) {
            msg = JSON.parse(JSON.stringify(msg)); // Clone the message

            // Populate the msg fields from the content of the email message
            // that we have just parsed.
            msg.html = mailMessage.html;
            msg.payload = mailMessage.text;
            if (mailMessage.attachments) {
                msg.attachments = mailMessage.attachments;
            } else {
                msg.attachments = [];
            }
            msg.topic = mailMessage.subject;
            msg.header = mailMessage.headers;
            msg.date = mailMessage.date;
            if (mailMessage.from && mailMessage.from.length > 0) {
                msg.from = mailMessage.from[0].address;
            }

            node.send(msg); // Propagate the message down the flow
        } // End of processNewMessage

        // Check the POP3 email mailbox for any new messages.  For any that are found,
        // retrieve each message, call processNewMessage to process it and then delete
        // the messages from the server.
        function checkPOP3(msg) {
            var currentMessage;
            var maxMessage;

            // Form a new connection to our email server using POP3.
            var pop3Client = new POP3Client(
                node.inport, node.inserver, {
                    enabletls: node.useSSL
                } // Should we use SSL to connect to our email server?
            );

            // If we have a next message to retrieve, ask to retrieve it otherwise issue a
            // quit request.
            function nextMessage() {
                if (currentMessage > maxMessage) {
                    pop3Client.quit();
                    return;
                }
                pop3Client.retr(currentMessage);
                currentMessage++;
            } // End of nextMessage

            pop3Client.on("stat", function(status, data) {
                // Data contains:
                // {
                //   count: <Number of messages to be read>
                //   octect: <size of messages to be read>
                // }
                if (status) {
                    currentMessage = 1;
                    maxMessage = data.count;
                    nextMessage();
                } else {
                    node.log(util.format("stat error: %s %j", status, data));
                }
            });

            pop3Client.on("error", function(err) {
                node.log("We caught an error: " + JSON.stringify(err));
            });

            pop3Client.on("connect", function() {
                //node.log("We are now connected");
                pop3Client.login("kolban@test.com", "password");
            });

            pop3Client.on("login", function(status, rawData) {
                //node.log("login: " + status + ", " + rawData);
                if (status) {
                    pop3Client.stat();
                } else {
                    node.log(util.format("login error: %s %j", status, rawData));
                    pop3Client.quit();
                }
            });

            pop3Client.on("retr", function(status, msgNumber, data, rawData) {
                node.log(util.format("retr: status=%s, msgNumber=%d, data=%j", status, msgNumber, data));
                if (status) {

                    // We have now received a new email message.  Create an instance of a mail parser
                    // and pass in the email message.  The parser will signal when it has parsed the message.
                    var mailparser = new MailParser();
                    mailparser.on("end", function(mailObject) {
                        //node.log(util.format("mailparser: on(end): %j", mailObject));
                        processNewMessage(msg, mailObject);
                    });
                    mailparser.write(data);
                    mailparser.end();
                    pop3Client.dele(msgNumber);
                } else {
                    node.log(util.format("retr error: %s %j", status, rawData));
                    pop3Client.quit();
                }
            });

            pop3Client.on("invalid-state", function(cmd) {
                node.log("Invalid state: " + cmd);
            });

            pop3Client.on("locked", function(cmd) {
                node.log("We were locked: " + cmd);
            });

            // When we have deleted the last processed message, we can move on to
            // processing the next message.
            pop3Client.on("dele", function(status, msgNumber) {
                nextMessage();
            });
        } // End of checkPOP3


        //
        // checkIMAP
        //
        // Check the email sever using the IMAP protocol for new messages.
        function checkIMAP(msg) {
            node.log("Checkimg IMAP for new messages");

            // We get back a 'ready' event once we have connected to imap
            imap.once('ready', function() {
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "email.status.fetching"
                });
                var pay = {};
                imap.openBox(node.box, false, function(err, box) {
                    if (err) {
                        node.status({
                            fill: "red",
                            shape: "ring",
                            text: "email.status.foldererror"
                        });
                        node.error(RED._("email.errors.fetchfail", {
                            folder: node.box
                        }), err);
                    } else {
                        if (box.messages.total > 0) {
                            imap.seq.search(['UNSEEN'], function(err, results) {
                                if (err) {
                                    throw err;
                                }
                                //console.log(results);
                                if (results.length > 0) {
                                    var f = imap.fetch(results, {
                                        markSeen: true,
                                        bodies: ['HEADER', 'TEXT']
                                    });
                                    f.on('message', function(msg, seqno) {
                                        node.log(RED._("email.status.message", {
                                            number: seqno
                                        }));
                                        var prefix = '(#' + seqno + ') ';
                                        msg.on('body', function(stream, info) {
                                            var buffer = '';
                                            stream.on('data', function(chunk) {
                                                buffer += chunk.toString('utf8');
                                            });
                                            stream.on('end', function() {
                                                if (info.which !== 'TEXT') {
                                                    var head = Imap.parseHeader(buffer);
                                                    if (head.hasOwnProperty("from")) {
                                                        pay.from = head.from[0];
                                                    }
                                                    if (head.hasOwnProperty("subject")) {
                                                        pay.topic = head.subject[0];
                                                    }
                                                    if (head.hasOwnProperty("date")) {
                                                        pay.date = head.date[0];
                                                    }
                                                    pay.header = head;
                                                } else {
                                                    var parts = buffer.split("Content-Type");
                                                    for (var p = 0; p < parts.length; p++) {
                                                        if (parts[p].indexOf("text/plain") >= 0) {
                                                            pay.payload = mimelib.decodeQuotedPrintable(parts[p].split("\n").slice(1, -2).join("\n").trim());
                                                        } else if (parts[p].indexOf("text/html") >= 0) {
                                                            pay.html = mimelib.decodeQuotedPrintable(parts[p].split("\n").slice(1, -2).join("\n").trim());
                                                        } else {
                                                            pay.payload = mimelib.decodeQuotedPrintable(parts[0]);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                        msg.on('end', function() {
                                            node.send(pay);
                                            node.log(RED._("email.status.newemail", {
                                                topic: prefix + ": " + pay.topic
                                            }));
                                        });
                                    });

                                    f.once('error', function(err) {
                                        node.warn(RED._("email.errors.messageerror", {
                                            error: err
                                        }));
                                        node.status({
                                            fill: "red",
                                            shape: "ring",
                                            text: "email.status.messageerror"
                                        });
                                    });

                                    f.once('end', function() {
                                        node.log("All emails read and sent");
                                        node.status({});
                                        imap.end();
                                    });
                                } else {
                                    node.log(RED._("email.status.inboxzero"));
                                    imap.end();
                                    node.status({});
                                }
                            });
                        } else {
                            node.log(RED._("email.status.inboxzero"));
                            imap.end();
                            node.status({});
                        }
                    }

                });
            }); // End of imap->ready
            imap.connect();
            node.status({
                fill: "grey",
                shape: "dot",
                text: "node-red:common.status.connecting"
            });
        } // End of checkIMAP


        // Perform a check of the email inboxes using either POP3 or IMAP
        function checkEmail(msg) {
            if (node.protocol === "POP3") {
                checkPOP3(msg);
            } else if (node.protocol === "IMAP") {
                checkIMAP(msg);
            }
        } // End of checkEmail

        if (node.protocol === "IMAP") {
            imap = new Imap({
                user: node.userid,
                password: node.password,
                host: node.inserver,
                port: node.inport,
                tls: node.useSSL,
                tlsOptions: {
                    rejectUnauthorized: false
                },
                connTimeout: node.repeat,
                authTimeout: node.repeat
            });
            imap.on('error', function(err) {
                node.log(err);
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "email.status.connecterror"
                });
            });
        }

        this.on("input", function(msg) {
            checkEmail(msg);
        });

        this.on("close", function() {
            if (this.interval_id != null) {
                clearInterval(this.interval_id);
            }
            if (imap) {
                imap.destroy();
            }
        });

        // Set the repetition timer as needed
        if (!isNaN(this.repeat) && this.repeat > 0) {
            this.interval_id = setInterval(function() {
                node.emit("input", {});
            }, this.repeat);
        }

        node.emit("input", {});
    }

    RED.nodes.registerType("e-mail in", EmailInNode, {
        credentials: {
            userid: {
                type: "text"
            },
            password: {
                type: "password"
            },
            global: {
                type: "boolean"
            }
        }
    });
};
