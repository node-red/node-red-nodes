/* eslint-disable indent */

const { domainToUnicode } = require("url");

/**
 * POP3 protocol - RFC1939 - https://www.ietf.org/rfc/rfc1939.txt
 *
 * Dependencies:
 * * node-pop3  - https://www.npmjs.com/package/node-pop3
 * * nodemailer - https://www.npmjs.com/package/nodemailer
 * * imap       - https://www.npmjs.com/package/imap
 * * mailparser - https://www.npmjs.com/package/mailparser
 */

module.exports = function(RED) {
    "use strict";
    var Imap = require('imap');
    var Pop3Command = require("node-pop3");
    var nodemailer = require("nodemailer");
    var simpleParser = require("mailparser").simpleParser;
    var SMTPServer = require("smtp-server").SMTPServer;
    //var microMTA = require("micromta").microMTA;
    var fs = require('fs');

    if (parseInt(process.version.split("v")[1].split(".")[0]) < 8) {
        throw "Error : Requires nodejs version >= 8.";
    }

    function EmailNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic;
        this.name = n.name;
        this.outserver = n.server;
        this.outport = n.port;
        this.secure = n.secure;
        this.tls = n.tls;
        this.authtype = n.authtype || "BASIC";
        if (this.authtype !== "BASIC") {
            this.inputs = 1;
            this.repeat = 0;
        }
        if (this.credentials && this.credentials.hasOwnProperty("userid")) {
            this.userid = this.credentials.userid;
        }
        else if (this.authtype !== "NONE") {
            this.error(RED._("email.errors.nouserid"));
        }
        if (this.authtype === "BASIC" ) {
            if (this.credentials && this.credentials.hasOwnProperty("password")) {
                this.password = this.credentials.password;
            }
            else {
                this.error(RED._("email.errors.nopassword"));
            }
        }
        else if (this.authtype === "XOAUTH2") {
            this.saslformat = n.saslformat;
            if (n.token !== "") {
                this.token = n.token;
            } else {
                this.error(RED._("email.errors.notoken"));
            }
        }
        var node = this;

        var smtpOptions = {
            host: node.outserver,
            port: node.outport,
            secure: node.secure,
            tls: {rejectUnauthorized: node.tls}
        }

        var smtpTransport;
        if (node.authtype === "XOAUTH2") {
            node.log("Using OAuth - setup transport later.")
        }
        else {
            if (node.authtype === "BASIC" ) {
                smtpOptions.auth = {
                    user: node.userid,
                    pass: node.password
                };
            }
            smtpTransport = nodemailer.createTransport(smtpOptions);
        }

        this.on("input", function(msg, send, done) {
            if (node.authtype === "XOAUTH2") {
                if (node.token) {
                    var saslxoauth2 = "";
                    var value = RED.util.getMessageProperty(msg,node.token);
                    if (value !== undefined) {
                        if (node.saslformat) {
                            //Make base64 string for access - compatible with outlook365 and gmail
                            saslxoauth2 = Buffer.from("user="+node.userid+"\x01auth=Bearer "+value+"\x01\x01").toString('base64');
                        } else {
                            saslxoauth2 = value;
                        }
                    }
                    smtpOptions.auth = {
                        type: "OAuth2",
                        user: node.userid,
                        accessToken: saslxoauth2
                    };
                    smtpTransport = nodemailer.createTransport(smtpOptions);
                }
                else {
                    node.warn(RED._("email.errors.notoken"));
                }
            }

            if (msg.hasOwnProperty("payload")) {
                send = send || function() { node.send.apply(node,arguments) };
                if (smtpTransport) {
                    node.status({fill:"blue",shape:"dot",text:"email.status.sending"});
                    if (msg.to && node.name && (msg.to !== node.name)) {
                        node.warn(RED._("node-red:common.errors.nooverride"));
                    }
                    var sendopts = { from: ((msg.from) ? msg.from : node.userid) };   // sender address
                    sendopts.to = node.name || msg.to; // comma separated list of addresses
                    if (node.name === "") {
                        sendopts.cc = msg.cc;
                        sendopts.bcc = msg.bcc;
                        sendopts.inReplyTo = msg.inReplyTo;
                        sendopts.replyTo = msg.replyTo;
                        sendopts.references = msg.references;
                        sendopts.headers = msg.headers;
                        sendopts.priority = msg.priority;
                    }
                    if (msg.hasOwnProperty("topic") && msg.topic === '') { sendopts.subject = ""; }
                    else { sendopts.subject = msg.topic || msg.title || "Message from Node-RED"; } // subject line
                    if (msg.hasOwnProperty("header") && msg.header.hasOwnProperty("message-id")) {
                        sendopts.inReplyTo = msg.header["message-id"];
                        sendopts.subject = "Re: " + sendopts.subject;
                    }
                    if (msg.hasOwnProperty("envelope")) { sendopts.envelope = msg.envelope; }
                    if (Buffer.isBuffer(msg.payload)) { // if it's a buffer in the payload then auto create an attachment instead
                        if (!msg.filename) {
                            var fe = "bin";
                            if ((msg.payload[0] === 0xFF)&&(msg.payload[1] === 0xD8)) { fe = "jpg"; }
                            if ((msg.payload[0] === 0x47)&&(msg.payload[1] === 0x49)) { fe = "gif"; } //46
                            if ((msg.payload[0] === 0x42)&&(msg.payload[1] === 0x4D)) { fe = "bmp"; }
                            if ((msg.payload[0] === 0x89)&&(msg.payload[1] === 0x50)) { fe = "png"; } //4E
                            msg.filename = "attachment."+fe;
                        }
                        var fname = msg.filename.replace(/^.*[\\\/]/, '') || "attachment.bin";
                        sendopts.attachments = [ { content:msg.payload, filename:fname } ];
                        if (msg.hasOwnProperty("headers") && msg.headers.hasOwnProperty("content-type")) {
                            sendopts.attachments[0].contentType = msg.headers["content-type"];
                        }
                        // Create some body text..
                        if (msg.hasOwnProperty("description")) { sendopts.text = msg.description; }
                        else { sendopts.text = RED._("email.default-message",{filename:fname}); }
                    }
                    else {
                        var payload = RED.util.ensureString(msg.payload);
                        sendopts.text = payload; // plaintext body
                        if (/<[a-z][\s\S]*>/i.test(payload)) {
                            sendopts.html = payload; // html body
                            if (msg.hasOwnProperty("plaintext")) {
                                var plaintext = RED.util.ensureString(msg.plaintext);
                                sendopts.text = plaintext; // plaintext body - specific plaintext version
                            }
                        }
                        if (msg.attachments) {
                            if (!Array.isArray(msg.attachments)) { sendopts.attachments = [ msg.attachments ]; }
                            else { sendopts.attachments = msg.attachments; }
                            for (const attachment of sendopts.attachments) {
                                if (attachment.hasOwnProperty('content')) {
                                    if (typeof attachment.content !== 'string' && !Buffer.isBuffer(attachment.content)) {
                                        node.error(RED._("email.errors.invalidattachment"),msg);
                                        node.status({fill:"red",shape:"ring",text:"email.status.sendfail"});
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    smtpTransport.sendMail(sendopts, function(error, info) {
                        if (error) {
                            node.error(error,msg);
                            node.status({fill:"red",shape:"ring",text:"email.status.sendfail",response:error.response,msg:{to:msg.to,topic:msg.topic,id:msg._msgid}});
                        } else {
                            node.log(RED._("email.status.messagesent",{response:info.response}));
                            node.status({text:"",response:info.response,msg:{to:msg.to,topic:msg.topic,id:msg._msgid}});
                            if (done) {
                                msg.payload = sendopts.text;
                                msg.from = sendopts.from;
                                msg.to = sendopts.to;
                                msg.topic = sendopts.subject;
                                msg.response = info.response;
                                done();
                            }
                        }
                    });
                }
                else { node.warn(RED._("email.errors.nosmtptransport")); }
            }
            else { node.warn(RED._("email.errors.nopayload")); }
        });
    }
    RED.nodes.registerType("e-mail", EmailNode, {
        credentials: {
            userid: {type:"text"},
            password: {type: "password"},
            global: { type:"boolean"}
        }
    });


    //
    // EmailInNode
    //
    // Setup the EmailInNode
    function EmailInNode(n) {
        var imap;
        var pop3;

        RED.nodes.createNode(this,n);
        this.name = n.name;
        this.inputs = n.inputs;
        this.repeat = n.repeat * 1000 || 300000;
        if (this.repeat > 2147483647) {
            // setTimeout/Interval has a limit of 2**31-1 Milliseconds
            this.repeat = 2147483647;
            this.error(RED._("email.errors.refreshtoolarge"));
        }
        if (this.repeat < 1500) {
            this.repeat = 1500;
        }
        if (this.inputs === 1) { this.repeat = 0; }
        this.inserver = n.server || "imap.gmail.com";
        this.inport = n.port || "993";
        this.box = n.box || "INBOX";
        this.useSSL= n.useSSL;
        this.autotls= n.autotls;
        this.protocol = n.protocol || "IMAP";
        this.disposition = n.disposition || "None"; // "None", "Delete", "Read"
        this.criteria = n.criteria || "UNSEEN"; // "ALL", "ANSWERED", "FLAGGED", "SEEN", "UNANSWERED", "UNFLAGGED", "UNSEEN"
        this.authtype = n.authtype || "BASIC";
        if (this.authtype !== "BASIC") {
            this.inputs = 1;
            this.repeat = 0;
        }

        if (this.credentials && this.credentials.hasOwnProperty("userid")) {
            this.userid = this.credentials.userid;
        }
        else if (this.authtype !== "NONE") {
            this.error(RED._("email.errors.nouserid"));
        }
        if (this.authtype === "BASIC" ) {
            if (this.credentials && this.credentials.hasOwnProperty("password")) {
                this.password = this.credentials.password;
            }
            else {
                this.error(RED._("email.errors.nopassword"));
            }
        }
        else if (this.authtype === "XOAUTH2") {
            this.saslformat = n.saslformat;
            if (n.token !== "") {
                this.token = n.token;
            } else {
                this.error(RED._("email.errors.notoken"));
            }
        }

        var node = this;
        node.interval_id = null;

        // Process a new email message by building a Node-RED message to be passed onwards
        // in the message flow.  The parameter called `msg` is the template message we
        // start with while `mailMessage` is an object returned from `mailparser` that
        // will be used to populate the email.
        // DCJ NOTE: - heirachical multipart mime parsers seem to not exist - this one is barely functional.
        function processNewMessage(msg, mailMessage) {
            msg = RED.util.cloneMessage(msg); // Clone the message
            // Populate the msg fields from the content of the email message
            // that we have just parsed.
            msg.payload = mailMessage.text;
            msg.topic = mailMessage.subject;
            msg.date = mailMessage.date;
            msg.header = {};
            mailMessage.headers.forEach((v, k) => {msg.header[k] = v;});
            if (mailMessage.html) { msg.html = mailMessage.html; }
            if (mailMessage.to && mailMessage.to.length > 0) { msg.to = mailMessage.to; }
            if (mailMessage.cc && mailMessage.cc.length > 0) { msg.cc = mailMessage.cc; }
            if (mailMessage.bcc && mailMessage.bcc.length > 0) { msg.bcc = mailMessage.bcc; }
            if (mailMessage.from && mailMessage.from.value && mailMessage.from.value.length > 0) { msg.from = mailMessage.from.value[0].address; }
            if (mailMessage.attachments) { msg.attachments = mailMessage.attachments; }
            else { msg.attachments = []; }
            node.send(msg); // Propagate the message down the flow
        } // End of processNewMessage

        // Check the POP3 email mailbox for any new messages.  For any that are found,
        // retrieve each message, call processNewMessage to process it and then delete
        // the messages from the server.
        async function checkPOP3(msg,send,done) {
            var tout = (node.repeat > 0) ? node.repeat - 500 : 15000;
            var saslxoauth2 = "";
            var currentMessage = 1;
            var maxMessage = 0;
            var nextMessage;

            pop3 = new Pop3Command({
                "host": node.inserver,
                "tls": node.useSSL,
                "timeout": tout,
                "port": node.inport
            });
            try {
                node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
                await pop3.connect();
                if (node.authtype === "XOAUTH2") {
                    var value = RED.util.getMessageProperty(msg,node.token);
                    if (value !== undefined) {
                        if (node.saslformat) {
                            //Make base64 string for access - compatible with outlook365 and gmail
                            saslxoauth2 = Buffer.from("user="+node.userid+"\x01auth=Bearer "+value+"\x01\x01").toString('base64');
                        } else {
                            saslxoauth2 = value;
                        }
                    }
                    await pop3.command('AUTH', "XOAUTH2");
                    await pop3.command(saslxoauth2);

                } else if (node.authtype === "BASIC") {
                    await pop3.command('USER', node.userid);
                    await pop3.command('PASS', node.password);
                }
            } catch(err) {
                node.error(err.message,err);
                node.status({fill:"red",shape:"ring",text:"email.status.connecterror"});
                setInputRepeatTimeout();
                done();
                return;
            }
            maxMessage = (await pop3.STAT()).split(" ")[0];
            if (maxMessage>0) {
                node.status({fill:"blue", shape:"dot", text:"email.status.fetching"});
                while(currentMessage<=maxMessage) {
                    try {
                        nextMessage = await pop3.RETR(currentMessage);
                    } catch(err) {
                        node.error(RED._("email.errors.fetchfail", err.message),err);
                        node.status({fill:"red",shape:"ring",text:"email.status.fetcherror"});
                        setInputRepeatTimeout();
                        done();
                        return;
                    }
                    try {
                        // We have now received a new email message.  Create an instance of a mail parser
                        // and pass in the email message.  The parser will signal when it has parsed the message.
                        simpleParser(nextMessage, {checksumAlgo: 'sha256'}, function(err, parsed) {
                            //node.log(util.format("simpleParser: on(end): %j", mailObject));
                            if (err) {
                                node.status({fill:"red", shape:"ring", text:"email.status.parseerror"});
                                node.error(RED._("email.errors.parsefail", {folder:node.box}), err);
                            }
                            else {
                                processNewMessage(msg, parsed);
                            }
                        });
                        //processNewMessage(msg, nextMessage);
                    } catch(err) {
                        node.error(RED._("email.errors.parsefail", {folder:node.box}), err);
                        node.status({fill:"red",shape:"ring",text:"email.status.parseerror"});
                        setInputRepeatTimeout();
                        done();
                        return;
                    }
                    await pop3.DELE(currentMessage);
                    currentMessage++;
                }
                await pop3.QUIT();
                node.status({fill:"green",shape:"dot",text:"finished"});
                setTimeout(status_clear, 5000);
                setInputRepeatTimeout();
                done();
            }

        } // End of checkPOP3


        //
        // checkIMAP
        //
        // Check the email sever using the IMAP protocol for new messages.
        var s = false;
        var ss = false;
        function checkIMAP(msg,send,done) {
            var tout = (node.repeat > 0) ? node.repeat - 500 : 15000;
            var saslxoauth2 = "";
            if (node.authtype === "XOAUTH2") {
                var value = RED.util.getMessageProperty(msg,node.token);
                if (value !== undefined) {
                    if (node.saslformat) {
                        //Make base64 string for access - compatible with outlook365 and gmail
                        saslxoauth2 = Buffer.from("user="+node.userid+"\x01auth=Bearer "+value+"\x01\x01").toString('base64');
                    } else {
                        saslxoauth2 = value;
                    }
                }
                imap = new Imap({
                    xoauth2: saslxoauth2,
                    host: node.inserver,
                    port: node.inport,
                    tls: node.useSSL,
                    autotls: node.autotls,
                    tlsOptions: { rejectUnauthorized: false },
                    connTimeout: tout,
                    authTimeout: tout
                });
            } else {
                imap = new Imap({
                    user: node.userid,
                    password: node.password,
                    host: node.inserver,
                    port: node.inport,
                    tls: node.useSSL,
                    autotls: node.autotls,
                    tlsOptions: { rejectUnauthorized: false },
                    connTimeout: tout,
                    authTimeout: tout
                });
            }
            imap.on('error', function(err) {
                if (err.errno !== "ECONNRESET") {
                    s = false;
                    node.error(err.message,err);
                    node.status({fill:"red",shape:"ring",text:"email.status.connecterror"});
                }
                setInputRepeatTimeout();
            });
            //console.log("Checking IMAP for new messages");
            // We get back a 'ready' event once we have connected to imap
            s = true;
            imap.once("ready", function() {
                if (ss === true) { return; }
                ss = true;
                node.status({fill:"blue", shape:"dot", text:"email.status.fetching"});
                //console.log("> ready");
                // Open the folder
                imap.openBox(node.box, // Mailbox name
                    false, // Open readonly?
                    function(err, box) {
                    //console.log("> Inbox err : %j", err);
                    //console.log("> Inbox open: %j", box);
                        if (err) {
                            var boxs = [];
                            imap.getBoxes(function(err,boxes) {
                                if (err) { return; }
                                for (var prop in boxes) {
                                    if (boxes.hasOwnProperty(prop)) {
                                        if (boxes[prop].children) {
                                            boxs.push(prop+"/{"+Object.keys(boxes[prop].children)+'}');
                                        }
                                        else { boxs.push(prop); }
                                    }
                                }
                                node.error(RED._("email.errors.fetchfail", {folder:node.box+".  Folders - "+boxs.join(', ')}),err);
                            });
                            node.status({fill:"red", shape:"ring", text:"email.status.foldererror"});
                            imap.end();
                            s = false;
                            setInputRepeatTimeout();
                            done(err);
                            return;
                        }
                        else {
                            var criteria = ((node.criteria === '_msg_')?
                                (msg.criteria || ["UNSEEN"]):
                                ([node.criteria]));
                            if (Array.isArray(criteria)) {
                                try {
                                    imap.search(criteria, function(err, results) {
                                        if (err) {
                                            node.status({fill:"red", shape:"ring", text:"email.status.foldererror"});
                                            node.error(RED._("email.errors.fetchfail", {folder:node.box}),err);
                                            imap.end();
                                            s = false;
                                            setInputRepeatTimeout();
                                            done(err);
                                            return;
                                        }
                                        else {
                                        //console.log("> search - err=%j, results=%j", err, results);
                                            if (results.length === 0) {
                                            //console.log(" [X] - Nothing to fetch");
                                                node.status({results:0});
                                                imap.end();
                                                s = false;
                                                setInputRepeatTimeout();
                                                msg.payload = 0;
                                                done();
                                                return;
                                            }

                                            var marks = false;
                                            if (node.disposition === "Read") { marks = true; }
                                            // We have the search results that contain the list of unseen messages and can now fetch those messages.
                                            var fetch = imap.fetch(results, {
                                                bodies: '',
                                                struct: true,
                                                markSeen: marks
                                            });

                                            // For each fetched message returned ...
                                            fetch.on('message', function(imapMessage, seqno) {
                                            //node.log(RED._("email.status.message",{number:seqno}));
                                            //console.log("> Fetch message - msg=%j, seqno=%d", imapMessage, seqno);
                                                imapMessage.on('body', function(stream, info) {
                                                //console.log("> message - body - stream=?, info=%j", info);
                                                    simpleParser(stream, {checksumAlgo: 'sha256'}, function(err, parsed) {
                                                        if (err) {
                                                            node.status({fill:"red", shape:"ring", text:"email.status.parseerror"});
                                                            node.error(RED._("email.errors.parsefail", {folder:node.box}),err);
                                                        }
                                                        else {
                                                            processNewMessage(msg, parsed);
                                                        }
                                                    });
                                                }); // End of msg->body
                                            }); // End of fetch->message

                                            // When we have fetched all the messages, we don't need the imap connection any more.
                                            fetch.on('end', function() {
                                                node.status({results:results.length});
                                                var cleanup = function() {
                                                    imap.end();
                                                    s = false;
                                                    setInputRepeatTimeout();
                                                    msg.payload = results.length;
                                                    done();
                                                };
                                                if (node.disposition === "Delete") {
                                                    imap.addFlags(results, '\\Deleted', imap.expunge(cleanup) );
                                                } else if (node.disposition === "Read") {
                                                    imap.addFlags(results, '\\Seen', cleanup);
                                                } else {
                                                    cleanup();
                                                }
                                            });

                                            fetch.once('error', function(err) {
                                                console.log('Fetch error: ' + err);
                                                imap.end();
                                                s = false;
                                                setInputRepeatTimeout();
                                                done(err);
                                            });
                                        }
                                    }); // End of imap->search
                                }
                                catch(e) {
                                    node.status({fill:"red", shape:"ring", text:"email.status.bad_criteria"});
                                    node.error(e.toString(),e);
                                    s = ss = false;
                                    imap.end();
                                    done(e);
                                    return;
                                }
                            }
                            else {
                                node.status({fill:"red", shape:"ring", text:"email.status.bad_criteria"});
                                node.error(RED._("email.errors.bad_criteria"),msg);
                                s = ss = false;
                                imap.end();
                                done();
                                return;
                            }
                        }
                    }); // End of imap->openInbox
            }); // End of imap->ready
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
            imap.connect();
        } // End of checkIMAP


        // Perform a check of the email inboxes using either POP3 or IMAP
        function checkEmail(msg,send,done) {
            if (node.protocol === "POP3") {
                checkPOP3(msg,send,done);
            } else if (node.protocol === "IMAP") {
                if (s === false && ss == false) { checkIMAP(msg,send,done); }
            }
        }  // End of checkEmail

        node.on("input", function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };
            checkEmail(msg,send,done);
        });

        node.on("close", function() {
            if (this.interval_id != null) {
                clearTimeout(this.interval_id);
            }
            if (imap) {
                imap.end();
                setTimeout(function() { imap.destroy(); },1000);
                node.status({});
            }
        });

        function status_clear() {
            node.status({});
        }

        function setInputRepeatTimeout() {
            // Set the repetition timer as needed
            if (!isNaN(node.repeat) && node.repeat > 0) {
                node.interval_id = setTimeout( function() {
                    node.emit("input",{});
                }, node.repeat );
            }
            ss = false;
        }

        if (this.inputs !== 1) { node.emit("input",{}); }
    }

    RED.nodes.registerType("e-mail in",EmailInNode,{
        credentials: {
            userid: { type:"text" },
            password: { type: "password" },
            global: { type:"boolean" }
        }
    });


    function EmailMtaNode(n) {
        RED.nodes.createNode(this, n);
        this.port = n.port;
        this.secure = n.secure;
        this.starttls = n.starttls;
        this.certFile = n.certFile;
        this.keyFile = n.keyFile;
        this.users = n.users;
        this.auth = n.auth;
        try {
            this.options = JSON.parse(n.expert);
        } catch (error) {
            this.options = {};
        }
        var node = this;
        if (!Array.isArray(node.options.disabledCommands)) {
            node.options.disabledCommands = [];
        }
        node.options.secure = node.secure;
        if (node.certFile) {
            node.options.cert = fs.readFileSync(node.certFile);
        }
        if (node.keyFile) {
            node.options.key = fs.readFileSync(node.keyFile);
        }
        if (!node.starttls) {
            node.options.disabledCommands.push("STARTTLS");
        }
        if (!node.auth) {
            node.options.disabledCommands.push("AUTH");
        }

        node.options.onData = function (stream, session, callback) {
            simpleParser(stream, { skipTextToHtml:true, skipTextLinks:true, checksumAlgo:'sha256' }, (err, parsed) => {
                if (err) { node.error(RED._("email.errors.parsefail"),err); }
                else {
                    node.status({fill:"green", shape:"dot", text:""});
                    var msg = {}
                    msg.payload = parsed.text;
                    msg.topic = parsed.subject;
                    msg.date = parsed.date;
                    msg.header = {};
                    parsed.headers.forEach((v, k) => {msg.header[k] = v;});
                    if (parsed.html) { msg.html = parsed.html; }
                    if (parsed.to) {
                        if (typeof(parsed.to) === "string" && parsed.to.length > 0) { msg.to = parsed.to; }
                        else if (parsed.to.hasOwnProperty("text") && parsed.to.text.length > 0) { msg.to = parsed.to.text; }
                    }
                    if (parsed.cc) {
                        if (typeof(parsed.cc) === "string" && parsed.cc.length > 0) { msg.cc = parsed.cc; }
                        else if (parsed.cc.hasOwnProperty("text") && parsed.cc.text.length > 0) { msg.cc = parsed.cc.text; }
                    }
                    if (parsed.cc && parsed.cc.length > 0) { msg.cc = parsed.cc; }
                    if (parsed.bcc && parsed.bcc.length > 0) { msg.bcc = parsed.bcc; }
                    if (parsed.from && parsed.from.value && parsed.from.value.length > 0) { msg.from = parsed.from.value[0].address; }
                    if (parsed.attachments) { msg.attachments = parsed.attachments; }
                    else { msg.attachments = []; }
                    node.send(msg); // Propagate the message down the flow
                    setTimeout(function() { node.status({})}, 500);
                }
                callback();
            });
        }

        node.options.onAuth = function (auth, session, callback) {
            let id = node.users.findIndex(function (item) {
                return item.name === auth.username;
            });
            if (id >= 0 && node.users[id].password === auth.password) {
                callback(null, { user: id + 1 });
            } else {
                callback(new Error("Invalid username or password"));
            }
        }

        node.mta = new SMTPServer(node.options);

        node.mta.listen(node.port);

        node.mta.on("error", err => {
            node.error("Error: " + err.message, err);
        });

        node.on("close", function() {
            node.mta.close();
        });
    }
    RED.nodes.registerType("e-mail mta",EmailMtaNode);

};
