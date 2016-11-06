
module.exports = function(RED) {
    "use strict";
    var XMPP = require('simple-xmpp');

    function XMPPServerNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.port = n.port;
        this.nickname = n.nickname;
        var credentials = this.credentials;
        if (credentials) {
            this.username = credentials.user;
            this.password = credentials.password;
        }
    }

    RED.nodes.registerType("xmpp-server",XMPPServerNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

    function XmppInNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;

        this.serverConfig = RED.nodes.getNode(this.server);
        this.host = this.serverConfig.server;
        this.port = this.serverConfig.port;
        this.nick = this.serverConfig.nickname || "Node-RED";
        this.userid = this.serverConfig.username;
        this.password = this.serverConfig.password;

        this.join = n.join || false;
        this.sendAll = n.sendObject;
        this.to = n.to || "";
        var node = this;

        var xmpp = new XMPP.SimpleXMPP();

        xmpp.on('online', function(data) {
            node.log('connected to '+node.host+":"+node.port);
            node.status({fill:"green",shape:"dot",text:"connected"});
            //xmpp.setPresence('online', node.nick+' online');
            if (node.join) {
                xmpp.join(node.to+'/'+node.nick);
            }
        });

        xmpp.on('chat', function(from, message) {
            var msg = { topic:from, payload:message };
            node.send([msg,null]);
        });

        xmpp.on('groupchat', function(conference, from, message, stamp) {
            var msg = { topic:from, payload:message, room:conference, ts:stamp };
            if (from != node.nick) { node.send([msg,null]); }
        });

        //xmpp.on('chatstate', function(from, state) {
        //console.log('%s is currently %s', from, state);
        //var msg = { topic:from, payload:state };
        //node.send([null,msg]);
        //});

        xmpp.on('buddy', function(jid, state, statusText) {
            node.log(jid+" is "+state+" : "+statusText);
            var msg = { topic:jid, payload: { presence:state, status:statusText} };
            node.send([null,msg]);
        });

        xmpp.on('error', function(err) {
            if (RED.settings.verbose) { node.log(err); }
            if (err.hasOwnProperty("stanza")) {
                if (err.stanza.name === 'stream:error') { node.error("stream:error - bad login id/pwd ?",err); }
                else { node.error(err.stanza.name,err); }
            }
            else {
                if (err.errno === "ETIMEDOUT") { node.error("Timeout connecting to server",err); }
                else { node.error(err.errno,err); }
            }
            node.status({fill:"red",shape:"ring",text:"error"});
        });

        xmpp.on('close', function() {
            node.log('connection closed');
            //node.status({fill:"grey",shape:"ring",text:"not connected"});
        });

        xmpp.on('subscribe', function(from) {
            xmpp.acceptSubscription(from);
        });

        // Now actually make the connection
        try {
            node.status({fill:"grey",shape:"dot",text:"connecting"});
            xmpp.connect({
                jid : node.userid,
                password : node.password,
                host : node.host,
                port : node.port,
                skipPresence : true,
                reconnect : false
            });
        } catch(e) {
            node.error("Bad xmpp configuration");
            node.status({fill:"red",shape:"ring",text:"not connected"});
        }

        node.on("close", function(done) {
            xmpp.setPresence('offline');
            xmpp.disconnect();
            if (xmpp.conn) { xmpp.conn.end(); }
            xmpp = null;
            node.status({});
            done();
        });
    }
    RED.nodes.registerType("xmpp in",XmppInNode);

    function XmppOutNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;

        this.serverConfig = RED.nodes.getNode(this.server);
        this.host = this.serverConfig.server;
        this.port = this.serverConfig.port;
        this.nick = this.serverConfig.nickname || "Node-RED";
        this.userid = this.serverConfig.username;
        this.password = this.serverConfig.password;

        this.join = n.join || false;
        this.sendAll = n.sendObject;
        this.to = n.to || "";
        var node = this;

        var xmpp = new XMPP.SimpleXMPP();

        xmpp.on('online', function(data) {
            node.status({fill:"green",shape:"dot",text:"connected"});
            node.log('connected to '+node.host+":"+node.port);
            xmpp.setPresence('online', node.nick+' online');
            if (node.join) {
                xmpp.join(node.to+'/'+node.nick);
            }
        });

        xmpp.on('error', function(err) {
            if (RED.settings.verbose) { node.log(err); }
            if (err.hasOwnProperty("stanza")) {
                if (err.stanza.name === 'stream:error') { node.error("stream:error - bad login id/pwd ?",err); }
                else { node.error(err.stanza.name,err); }
            }
            else {
                if (err.errno === "ETIMEDOUT") { node.error("Timeout connecting to server",err); }
                else { node.error(err.errno,err); }
            }
            node.status({fill:"red",shape:"ring",text:"error"});
        });

        xmpp.on('close', function() {
            node.log('connection closed');
            //node.status({fill:"grey",shape:"ring",text:"not connected"});
        });

        xmpp.on('subscribe', function(from) {
            xmpp.acceptSubscription(from);
        });

        // Now actually make the connection
        try {
            node.status({fill:"grey",shape:"dot",text:"connecting"});
            xmpp.connect({
                jid : node.userid,
                password : node.password,
                host : node.host,
                port : node.port,
                skipPresence : true,
                reconnect : false
            });
        } catch(e) {
            node.error("Bad xmpp configuration");
            node.status({fill:"red",shape:"ring",text:"not connected"});
        }

        node.on("input", function(msg) {
            if (msg.presence) {
                if (['away', 'dnd', 'xa','chat'].indexOf(msg.presence) > -1 ) {
                    xmpp.setPresence(msg.presence, msg.payload);
                }
                else { node.warn("Can't set presence - invalid value"); }
            }
            else {
                var to = msg.topic;
                if (node.to !== "") { to = node.to; }
                if (node.sendAll) {
                    xmpp.send(to, JSON.stringify(msg), node.join);
                }
                else if (msg.payload) {
                    if (typeof(msg.payload) === "object") {
                        xmpp.send(to, JSON.stringify(msg.payload), node.join);
                    } else {
                        xmpp.send(to, msg.payload.toString(), node.join);
                    }
                }
            }
        });

        node.on("close", function(done) {
            xmpp.setPresence('offline');
            xmpp.disconnect();
            if (xmpp.conn) { xmpp.conn.end(); }
            xmpp = null;
            node.status({});
            done();
        });
    }
    RED.nodes.registerType("xmpp out",XmppOutNode);
}
