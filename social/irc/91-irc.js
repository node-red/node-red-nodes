
module.exports = function(RED) {
    "use strict";
    var irc = require("irc");


    // The Server Definition - this opens (and closes) the connection
    function IRCServerNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.port = n.port || 6667;
        this.ssl = n.ssl || false;
        this.cert = n.cert || false;
        this.channel = n.channel;
        this.nickname = n.nickname;
        this.lastseen = 0;
        this.ircclient = null;
        this.on("close", function() {
            if (this.ircclient != null) {
                this.ircclient.removeAllListeners();
                this.ircclient.disconnect();
            }
        });

        this.username = null;
        this.password = null;
        if (this.credentials && this.credentials.hasOwnProperty("username")) {
            this.username = this.credentials.username;
        }
        if (this.credentials && this.credentials.hasOwnProperty("password")) {
            this.password = this.credentials.password;
        }

    }
    RED.nodes.registerType("irc-server",IRCServerNode, {
        credentials: {
            username: {type:"text"},
            password: {type:"password"}
        }
    });


    // The Input Node
    function IrcInNode(n) {
        RED.nodes.createNode(this,n);
        this.ircserver = n.ircserver;
        this.serverConfig = RED.nodes.getNode(this.ircserver);
        this.channel = n.channel || this.serverConfig.channel;
        var node = this;
        if (node.serverConfig.ircclient === null) {
            node.log(RED._("irc.errors.connect")+": "+node.serverConfig.server+" "+node.serverConfig.username+" "+node.serverConfig.ssl);
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
            var options = {autoConnect:true,autoRejoin:false,floodProtection:true,secure:node.serverConfig.ssl,selfSigned:node.serverConfig.cert,port:node.serverConfig.port,retryDelay:20000};
            if (node.serverConfig.username !== null) { options["userName"] = node.serverConfig.username }
            if (node.serverConfig.password !== null) { options["password"] = node.serverConfig.password }
            node.serverConfig.ircclient = new irc.Client(node.serverConfig.server, node.serverConfig.nickname, options);
            node.serverConfig.ircclient.setMaxListeners(0);
            node.serverConfig.ircclient.addListener('error', function(message) {
                if (RED.settings.verbose) { node.log(RED._("irc.errors.err")+": "+JSON.stringify(message)); }
            });
            node.serverConfig.ircclient.addListener('netError', function(message) {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.net")+": "+JSON.stringify(message)); }
                node.status({fill:"red",shape:"ring",text:"node-red:common.status.neterror"});
            });
            node.serverConfig.ircclient.addListener('connect', function() {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.connected")); }
            });
            node.serverConfig.ircclient.addListener('registered', function(message) {
                node.serverConfig.lastseen = Date.now();
                node.log(node.serverConfig.ircclient.nick+" "+RED._("irc.errors.online")+": "+message.server);
                node.status({fill:"yellow",shape:"dot",text:"node-red:common.status.connected"});
                node.serverConfig.ircclient.join( node.channel, function(data) {
                    node.log(data+" "+RED._("irc.errors.joined")+": "+node.channel);
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.joined"});
                });
            });
            node.serverConfig.ircclient.addListener('ping', function(server) {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.ping")+" "+JSON.stringify(server)); }
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.ok"});
            });
            node.serverConfig.ircclient.addListener('quit', function(nick, reason, channels, message) {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.quit")+": "+nick+" "+reason+" "+channels+" "+JSON.stringify(message)); }
                node.status({fill:"grey",shape:"ring",text:"node-red:common.status.quit"});
                //node.serverConfig.ircclient.disconnect( function() {
                //    node.serverConfig.ircclient.connect();
                //});
                //if (RED.settings.verbose) { node.log(RED._("irc.errors.restart")); }          // then retry
            });
            node.serverConfig.ircclient.addListener('raw', function (message) { // any message received means we are alive
                //console.log("RAW:"+JSON.stringify(message));
                if (message.commandType === "reply") {
                    //console.log("RAW:"+JSON.stringify(message));
                    node.serverConfig.lastseen = Date.now();
                }
            });
            node.recon = setInterval( function() {
                //console.log("CHK ",(Date.now()-node.serverConfig.lastseen)/1000);
                if ((Date.now()-node.serverConfig.lastseen) > 240000) {     // if more than 4 mins since last seen
                    node.serverConfig.ircclient.send.apply(node.serverConfig.ircclient,["TIME"]);     // request time to check link
                }
                if ((Date.now()-node.serverConfig.lastseen) > 300000) {     // If more than 5 mins
                    //node.serverConfig.ircclient.disconnect();
                    //node.serverConfig.ircclient.connect();
                    node.status({fill:"grey",shape:"ring",text:"node-red:common.status.noconnection"});
                    if (RED.settings.verbose) { node.log(RED._("irc.errors.connectionlost")); }
                }
                //node.serverConfig.ircclient.send.apply(node.serverConfig.ircclient,["TIME"]); // request time to check link
            }, 60000); // check every 1 min
            //node.serverConfig.ircclient.connect();
        }
        else { node.status({text:""}); }
        node.ircclient = node.serverConfig.ircclient;

        node.ircclient.addListener('registered', function(message) {
            //node.log(node.ircclient.nick+" "+RED._("irc.errors.online"));
            node.status({fill:"yellow",shape:"dot",text:"node-red:common.status.connected"});
            node.ircclient.join( node.channel, function(data) {
                // node.log(data+" "+RED._("irc.errors.joined")+" "+node.channel);
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.joined"});
            });
        });
        node.ircclient.addListener('message', function (from, to, message) {
            //node.log(from + ' => ' + to + ' : ' + message);
            if (~node.channel.toLowerCase().indexOf(to.toLowerCase())) {
                var msg = { "topic":from, "from":from, "to":to, "payload":message };
                node.send([msg,null]);
            }
            //else { console.log(node.channel,to); }
        });
        node.ircclient.addListener('pm', function(from, message) {
            //node.log("PM => "+from + ': ' + message);
            var msg = { "topic":from, "from":from, "to":"PRIV", "payload":message };
            node.send([msg,null]);
        });
        node.ircclient.addListener('join', function(channel, who) {
            var msg = { "payload": { "type":"join", "who":who, "channel":channel } };
            node.send([null,msg]);
            //node.log(who+' '+RED._("irc.errors.hasjoined")+' '+channel);
        });
        node.ircclient.addListener('invite', function(channel, from, message) {
            var msg = { "payload": { "type":"invite", "who":from, "channel":channel, "message":message } };
            node.send([null,msg]);
            //node.log(from+' '+RED._("irc.errors.sentinvite")+' '+channel+': '+message);
        });
        node.ircclient.addListener('part', function(channel, who, reason) {
            var msg = { "payload": { "type":"part", "who":who, "channel":channel, "reason":reason } };
            node.send([null,msg]);
            //node.log(who+' '+RED._("irc.errors.hasleft")+' '+channel+': '+reason);
        });
        node.ircclient.addListener('topic', function (channel, topic, nick, message) {
            var msg = { "payload": { "type":"topic", "who":nick, "channel":channel, "topic":topic, "message":message } };
            node.send([null,msg]);
            //node.log(nick+' '+RED._("irc.errors.topicchanged")+' '+channel+': '+topic);
        });
        node.ircclient.addListener('quit', function(nick, reason, channels, message) {
            var msg = { "payload": { "type":"quit", "who":nick, "channel":channels, "reason":reason } };
            node.send([null,msg]);
            //node.log(nick+' '+RED._("irc.errors.hasquit")+' '+channels+': '+reason);
        });
        node.ircclient.addListener('kick', function(channel, who, by, reason) {
            var msg = { "payload": { "type":"kick", "who":who, "channel":channel, "by":by, "reason":reason } };
            node.send([null,msg]);
            //node.log(who+' '+RED._("irc.errors.kickedfrom")+' '+channel+' by '+by+': '+reason);
        });
        node.ircclient.addListener('names', function (channel, nicks) {
            var msg = { "payload": { "type": "names", "channel": channel, "names": nicks} };
            node.send([null, msg]);
        });
        node.ircclient.addListener('raw', function (message) { // any message means we are alive
            node.serverConfig.lastseen = Date.now();
        });
        node.on("close", function() {
            node.ircclient.removeAllListeners();
            if (node.recon) { clearInterval(node.recon); }
        });
    }
    RED.nodes.registerType("irc in",IrcInNode);


    // The Output Node
    function IrcOutNode(n) {
        RED.nodes.createNode(this,n);
        this.sendFlag = n.sendObject;
        this.ircserver = n.ircserver;
        this.serverConfig = RED.nodes.getNode(this.ircserver);
        this.channel = n.channel || this.serverConfig.channel;
        var node = this;
        if (node.serverConfig.ircclient === null) {
            node.log(RED._("irc.errors.connect")+": "+node.serverConfig.server);
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
            var options = {autoConnect:true,autoRejoin:false,floodProtection:true,secure:node.serverConfig.ssl,selfSigned:node.serverConfig.cert,port:node.serverConfig.port,retryDelay:20000};
            if (node.serverConfig.username !== null) { options['userName'] = node.serverConfig.username }
            if (node.serverConfig.password !== null) { options['password'] = node.serverConfig.password }
            node.serverConfig.ircclient = new irc.Client(node.serverConfig.server, node.serverConfig.nickname, options);
            node.serverConfig.ircclient.setMaxListeners(0);
            node.serverConfig.ircclient.addListener('error', function(message) {
                if (RED.settings.verbose) { node.log(RED._("irc.errors.err")+": "+JSON.stringify(message)); }
            });
            node.serverConfig.ircclient.addListener('netError', function(message) {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.net")+": "+JSON.stringify(message)); }
                node.status({fill:"red",shape:"ring",text:"node-red:common.status.neterror"});
            });
            node.serverConfig.ircclient.addListener('connect', function() {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.connected")); }
            });
            node.serverConfig.ircclient.addListener('registered', function(message) {
                node.serverConfig.lastseen = Date.now();
                node.log(node.serverConfig.ircclient.nick+" "+RED._("irc.errors.online")+": "+message.server);
                node.status({fill:"yellow",shape:"dot",text:"node-red:common.status.connected"});
                node.serverConfig.ircclient.join( node.channel, function(data) {
                    node.log(data+" "+RED._("irc.errors.joined")+": "+node.channel);
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.joined"});
                });
            });
            node.serverConfig.ircclient.addListener('ping', function(server) {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.ping")+" "+JSON.stringify(server)); }
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.ok"});
            });
            node.serverConfig.ircclient.addListener('quit', function(nick, reason, channels, message) {
                node.serverConfig.lastseen = Date.now();
                if (RED.settings.verbose) { node.log(RED._("irc.errors.quit")+": "+nick+" "+reason+" "+channels+" "+JSON.stringify(message)); }
                node.status({fill:"grey",shape:"ring",text:"node-red:common.status.quit"});
                //node.serverConfig.ircclient.disconnect( function() {
                //    node.serverConfig.ircclient.connect();
                //});
                //if (RED.settings.verbose) { node.log(RED._("irc.errors.restart")); }          // then retry
            });
            node.serverConfig.ircclient.addListener('raw', function (message) { // any message received means we are alive
                //console.log("RAW:"+JSON.stringify(message));
                if (message.commandType === "reply") {
                    //console.log("RAW:"+JSON.stringify(message));
                    node.serverConfig.lastseen = Date.now();
                }
            });
            node.recon = setInterval( function() {
                //console.log("CHK ",(Date.now()-node.serverConfig.lastseen)/1000);
                if ((Date.now()-node.serverConfig.lastseen) > 240000) {     // if more than 4 mins since last seen
                    node.serverConfig.ircclient.send.apply(node.serverConfig.ircclient,["TIME"]);     // request time to check link
                }
                if ((Date.now()-node.serverConfig.lastseen) > 300000) {     // If more than 5 mins
                    //node.serverConfig.ircclient.disconnect();
                    //node.serverConfig.ircclient.connect();
                    node.status({fill:"grey",shape:"ring",text:"node-red:common.status.noconnection"});
                    if (RED.settings.verbose) { node.log(RED._("irc.errors.connectionlost")); }
                }
                //node.serverConfig.ircclient.send.apply(node.serverConfig.ircclient,["TIME"]); // request time to check link
            }, 60000); // check every 1 min
            //node.serverConfig.ircclient.connect();
        }
        else { node.status({text:""}); }
        node.ircclient = node.serverConfig.ircclient;

        node.on("input", function(msg) {
            if (Object.prototype.toString.call( msg.raw ) === '[object Array]') {
                if (RED.settings.verbose) { node.log(RED._("irc.errors.rawcommand")+":"+msg.raw); }
                node.ircclient.send.apply(node.ircclient,msg.raw);
            }
            else {
                if (msg._topic) { delete msg._topic; }
                var ch = node.channel.split(","); // split on , so we can send to multiple
                if (node.sendFlag == "true") { // override channels with msg.topic
                    if ((msg.hasOwnProperty('topic'))&&(typeof msg.topic === "string")) {
                        ch = msg.topic.split(","); // split on , so we can send to multiple
                    }
                    else { node.warn(RED._("irc.errors.topicnotset")); }
                }
                for (var c = 0; c < ch.length; c++) {
                    if (node.sendFlag == "false") { // send whole message object to each channel
                        node.ircclient.say(ch[c], JSON.stringify(msg));
                    }
                    else { // send just the payload to each channel
                        if (typeof msg.payload === "object") { msg.payload = JSON.stringify(msg.payload); }
                        node.ircclient.say(ch[c], msg.payload);
                    }
                }
            }
        });

        node.on("close", function() {
            node.ircclient.removeAllListeners();
            if (node.recon) { clearInterval(node.recon); }
        });
    }
    RED.nodes.registerType("irc out",IrcOutNode);
}
