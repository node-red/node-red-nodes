
module.exports = function(RED) {
    "use strict";
    var XMPP = require('simple-xmpp');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    function XMPPServerNode(n) {
        RED.nodes.createNode(this,n);
        // this.server = n.server;
        // this.port = n.port;
        this.nickname = n.nickname;
        this.username = n.user;
        var credentials = this.credentials;
        if (credentials) {
            this.password = credentials.password;
        }
        this.client = new XMPP.SimpleXMPP();
        this.connected = false;
        var that = this;

        this.client.con = function() {
            if (that.connected === false ) {
                that.connected = true;
                that.client.connect({
                    jid : that.username,
                    password : that.password,
                    // host : node.host,
                    //port : node.port,
                    //skipPresence : true,
                    reconnect : true,
                    preferred : "PLAIN"
                });
            }
        }

        that.client.on('online', function(data) {
            that.connected = true;
            that.client.setPresence('online', data.jid.user+' is online');
            that.log('connected as '+data.jid.user+' to '+data.jid._domain+":5222");
        });
        that.client.on('close', function() {
            that.connected = false;
            that.log('connection closed');
        });
        this.on("close", function(done) {
            that.client.setPresence('offline');
            that.client.disconnect();
            if (that.client.conn) { that.client.conn.end(); }
            that.client = null;
            done();
        });
    }

    RED.nodes.registerType("xmpp-server",XMPPServerNode,{
        credentials: {
            password: {type: "password"}
        }
    });

    function XmppInNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.serverConfig = RED.nodes.getNode(this.server);
        this.nick = this.serverConfig.nickname || this.serverConfig.username.split("@")[0];
        this.join = n.join || false;
        this.sendAll = n.sendObject;
        this.from = n.to || "";
        var node = this;

        var xmpp = this.serverConfig.client;

        xmpp.on('online', function(data) {
            node.status({fill:"green",shape:"dot",text:"connected"});
            if ((node.join) && (node.from !== "")) {
                // disable chat history
                var to = node.to+'/'+node.nick;
                var stanza = new xmpp.Element('presence', {"to": to}).
                    c('x', { xmlns: 'http://jabber.org/protocol/muc' }).
                    c('history', { maxstanzas:0, seconds:1 });
                xmpp.conn.send(stanza);
                xmpp.join(to);
            }
        });

        // xmpp.on('chat', function(from, message) {
        //     var msg = { topic:from, payload:message };
        //     if (!node.join && ((node.from === "") || (node.from === from))) {
        //         node.send([msg,null]);
        //     }
        // });

        xmpp.on('stanza', function(stanza) {
            if (stanza.is('message')) {
                if (stanza.attrs.type == 'chat') {
                    //console.log(stanza);
                    var body = stanza.getChild('body');
                    if (body) {
                        var msg = { payload:body.getText() };
                        var ids = stanza.attrs.from.split('/');
                        if (ids[1].length !== 36) {
                            msg.topic = stanza.attrs.from
                        }
                        else { msg.topic = ids[0]; }
                        if (!node.join && ((node.from === "") || (node.from === stanza.attrs.from))) {
                            node.send([msg,null]);
                        }
                    }
                }
            }
        });

        xmpp.on('groupchat', function(conference, from, message, stamp) {
            var msg = { topic:from, payload:message, room:conference };
            if (from != node.nick) {
                if ((node.join) && (node.from === conference)) {
                    node.send([msg,null]);
                }
            }
        });

        //xmpp.on('chatstate', function(from, state) {
        //console.log('%s is currently %s', from, state);
        //var msg = { topic:from, payload: {presence:state} };
        //node.send([null,msg]);
        //});

        xmpp.on('buddy', function(jid, state, statusText) {
            node.log(jid+" is "+state+" : "+statusText);
            var msg = { topic:jid, payload: { presence:state, status:statusText} };
            node.send([null,msg]);
        });

        // xmpp.on('groupbuddy', function(conference, from, state, statusText) {
        //     //console.log('%s: %s is in %s state - %s',conference, from, state, statusText);
        //     var msg = { topic:from, payload: { presence:state, status:statusText}, room:conference };
        // });

        xmpp.on('error', function(err) {
            if (RED.settings.verbose) { node.log(err); }
            if (err.hasOwnProperty("stanza")) {
                if (err.stanza.name === 'stream:error') { node.error("stream:error - bad login id/pwd ?",err); }
                else { node.error(err.stanza.name,err); }
                node.status({fill:"red",shape:"ring",text:"bad login"});
            }
            else {
                if (err.errno === "ETIMEDOUT") {
                    node.error("Timeout connecting to server",err);
                    node.status({fill:"red",shape:"ring",text:"timeout"});
                }
                else if (err === "XMPP authentication failure") {
                    node.error(err,err);
                    node.status({fill:"red",shape:"ring",text:"XMPP authentication failure"});
                }
                else {
                    node.error(err.errno,err);
                    node.status({fill:"red",shape:"ring",text:"error"});
                }
            }
        });

        xmpp.on('subscribe', function(from) {
            xmpp.acceptSubscription(from);
        });

        // Now actually make the connection
        try {
            node.status({fill:"grey",shape:"dot",text:"connecting"});
            xmpp.con();
        }
        catch(e) {
            node.error("Bad xmpp configuration");
            node.status({fill:"red",shape:"ring",text:"not connected"});
        }

        node.on("close", function() {
            node.status({});
        });
    }
    RED.nodes.registerType("xmpp in",XmppInNode);


    function XmppOutNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.serverConfig = RED.nodes.getNode(this.server);
        this.nick = this.serverConfig.nickname || this.serverConfig.username.split("@")[0];
        this.join = n.join || false;
        this.sendAll = n.sendObject;
        this.to = n.to || "";
        var node = this;

        var xmpp = this.serverConfig.client;

        xmpp.on('online', function(data) {
            node.status({fill:"green",shape:"dot",text:"connected"});
            if ((node.join) && (node.from !== "")) {
                // disable chat history
                var to = node.to+'/'+node.nick;
                var stanza = new xmpp.Element('presence', {"to": to}).
                    c('x', { xmlns: 'http://jabber.org/protocol/muc' }).
                    c('history', { maxstanzas:0, seconds:1 });
                xmpp.conn.send(stanza);
                xmpp.join(to);
            }
        });

        xmpp.on('error', function(err) {
            if (RED.settings.verbose) { node.log(err); }
            if (err.hasOwnProperty("stanza")) {
                if (err.stanza.name === 'stream:error') { node.error("stream:error - bad login id/pwd ?",err); }
                else { node.error(err.stanza.name,err); }
                node.status({fill:"red",shape:"ring",text:"bad login"});
            }
            else {
                if (err.errno === "ETIMEDOUT") {
                    node.error("Timeout connecting to server",err);
                    node.status({fill:"red",shape:"ring",text:"timeout"});
                }
                else if (err === "XMPP authentication failure") {
                    node.error(err,err);
                    node.status({fill:"red",shape:"ring",text:"XMPP authentication failure"});
                }
                else {
                    node.error(err.errno,err);
                    node.status({fill:"red",shape:"ring",text:"error"});
                }
            }
        });

        // Now actually make the connection
        try {
            node.status({fill:"grey",shape:"dot",text:"connecting"});
            xmpp.con();
        }
        catch(e) {
            node.error("Bad xmpp configuration");
            node.status({fill:"red",shape:"ring",text:"not connected"});
        }

        node.on("input", function(msg) {
            if (msg.presence) {
                if (['away', 'dnd', 'xa', 'chat'].indexOf(msg.presence) > -1 ) {
                    xmpp.setPresence(msg.presence, msg.payload);
                }
                else { node.warn("Can't set presence - invalid value: "+msg.presence); }
            }
            else {
                var to = node.to || msg.topic || "";
                if (to !== "") {
                    if (node.sendAll) {
                        xmpp.send(to, JSON.stringify(msg), node.join);
                    }
                    else if (msg.payload) {
                        if (typeof(msg.payload) === "object") {
                            xmpp.send(to, JSON.stringify(msg.payload), node.join);
                        }
                        else {
                            xmpp.send(to, msg.payload.toString(), node.join);
                        }
                    }
                }
            }
        });

        node.on("close", function() {
            node.status({});
        });
    }
    RED.nodes.registerType("xmpp out",XmppOutNode);
}
