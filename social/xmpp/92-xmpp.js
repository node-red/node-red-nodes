
module.exports = function(RED) {
    "use strict";
    const {client, xml, jid} = require('@xmpp/client')
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    const LOGITALL=false;

    function XMPPServerNode(n) {
        RED.nodes.createNode(this,n);
        this.nickname = n.nickname;
        this.jid = n.user;
        this.username = n.user.split('@')[0];
        // The user may elect to just specify the jid in the settings,
        //  in which case extract the server from the jid and default the port
        if("undefined" === typeof n.server || n.server === ""){
            this.server = n.user.split('@')[1];
        }
        else{
            this.server = n.server;
        }
        if("undefined" === typeof n.port || n.port === ""){
            this.port = 5222;
        }
        else{
            this.port = n.port;
        }

        // The password is obfuscated and stored in a separate location
        var credentials = this.credentials;
        if (credentials) {
            this.password = credentials.password;
        }
        // The basic xmpp client object, this will be referred to as "xmpp" in the nodes.
        // note we're not actually connecting here.
        this.client = client({
            service: 'xmpp://' + this.server + ':' + this.port,
            username: this.username,
            password: this.password
        });

        // helper variable for checking against later, maybe we should be using the client
        // object directly...
        this.connected = false;
        // store the nodes that have us as config so we know when to tear it all down.
        this.users = {};
        // helper variable, because "this" changes definition inside a callback
        var that = this;

        // function for a node to tell us it has us as config
        this.register = function(xmppThat) {
            if (RED.settings.verbose || LOGITALL) {that.log("registering "+xmppThat.id);}
            that.users[xmppThat.id] = xmppThat;
            // So we could start the connection here, but we already have the logic in the thats.
            // if (Object.keys(that.users).length === 1) {
            //   this.client.start();
            // }
        };

        // function for a node to tell us it's not using us anymore
        this.deregister = function(xmppThat,done) {
            if (RED.settings.verbose || LOGITALL) {that.log("deregistering "+xmppThat.id);}
            delete that.users[xmppThat.id];
            if (that.closing) {
                return done();
            }
            if (Object.keys(that.users).length === 0) {
                if (that.client && that.client.connected) {
                    return that.client.stop(done);
                } else {
                    that.client.stop();
                    return done();
                }
            }
            done();
        };

        // store the last node to use us, in case we get an error back
        this.lastUsed = undefined;
        // function for a node to tell us it has just sent a message to our server
        // so we know which node to blame if it all goes Pete Tong
        this.used = function(xmppThat){
            if (RED.settings.verbose || LOGITALL) {that.log(xmppThat.id+" sent a message to the xmpp server");}
            that.lastUsed = xmppThat;
        }


        // Some errors come back as a message :-(
        // this means we need to figure out which node might have sent it
        // we also deal with subscriptions (i.e. presence information) here
        this.client.on('stanza', async (stanza) =>{
            if (stanza.is('message')) {
                if (stanza.attrs.type == 'error') {
                    if (RED.settings.verbose || LOGITALL) {
                        that.log("Received error");
                        that.log(stanza);
                    }
                    var err = stanza.getChild('error');
                    if(err){
                        var textObj = err.getChild('text');
                        var text = "node-red:common.status.error";
                        if("undefined" !== typeof textObj){
                            text = textObj.getText();
                        }
                        if (RED.settings.verbose || LOGITALL) {that.log("Culprit: "+that.lastUsed);}
                        if("undefined" !== typeof that.lastUsed){
                            that.lastUsed.status({fill:"red",shape:"ring",text:text});
                            that.lastUsed.warn(text);
                        }
                        // maybe throw the message or summit
                        //that.error(text);
                    }
                }
            }
            else if(stanza.is('presence')){
                if(['subscribe','subscribed','unsubscribe','unsubscribed'].indexOf(stanza.attrs.type) > -1){
                    if (RED.settings.verbose || LOGITALL) {that.log("got a subscription based message");}
                    switch(stanza.attrs.type){
                    case 'subscribe':
                        // they're asking for permission let's just say yes
                        var response = xml('presence',
                                           {type:'subscribed', to:stanza.attrs.from});
                        // if an error comes back we can't really blame anyone else
                        that.used(that);
                        that.client.send(response);
                        break;
                    default:
                        that.log("Was told we've "+stanza.attrs.type+" from "+stanza.attrs.from+" but we don't really care");
                    }
                }
            }
        });
        // We shouldn't have any errors here that the input/output nodes can't handle
        //   if you need to see everything though; uncomment this block
        // this.client.on('error', err => {
        //   that.warn(err);
        //   that.warn(err.stack);
        // });

        // this gets called when we've completed the connection
        this.client.on('online', async address => {
            // provide some presence so people can see we're online
            that.connected = true;
            await that.client.send(xml('presence'));
            //      await that.client.send(xml('presence', {type: 'available'},xml('status', {}, 'available')));
            if (RED.settings.verbose || LOGITALL) {that.log('connected as '+that.username+' to ' +that.server+':'+that.port);}
        });

        // if the connection has gone away, not sure why!
        this.client.on('offline', () => {
            that.connected = false;
            if (RED.settings.verbose || LOGITALL) {that.log('connection closed');}
        });

        // gets called when the node is destroyed, e.g. if N-R is being stopped.
        this.on("close", async done => {
            if(that.connected){
                await that.client.send(xml('presence', {type: 'unavailable'}));
            }
            that.client.stop().catch(that.error);
            
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
        
        /* connection states
           online: We are connected
           offline: disconnected and will not autoretry
           connecting: Socket is connecting
           connect: Socket is connected
           opening: Stream is opening
           open: Stream is open
           closing: Stream is closing
           close: Stream is closed
           disconnecting: Socket is disconnecting
           disconnect: Socket is disconnected
        */

        xmpp.on('online', async address => {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
            if ((node.join) && (node.from !== "")) {
                var to = node.from+'/'+node.nick;
                // the presence with the muc x element signifies we want to join the muc
                // if we want to support passwords, we need to add that as a child of the x element
                // (third argument to the x/muc/children )
                // We also turn off chat history (maxstanzas 0) because that's not what this node is about.
                var stanza = xml('presence',
                                 {"to": to},
                                 xml("x",'http://jabber.org/protocol/muc'),
                                 { maxstanzas:0, seconds:1 }
                                );
                node.serverConfig.used(node);
                xmpp.send(stanza);
            }
        });

        xmpp.on('connecting', async address => {
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
        });
        xmpp.on('connect', async address => {
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connected"});
        });
        xmpp.on('opening', async address => {
            node.status({fill:"grey",shape:"dot",text:"opening"});
        });
        xmpp.on('open', async address => {
            node.status({fill:"grey",shape:"dot",text:"open"});
        });
        xmpp.on('closing', async address => {
            node.status({fill:"grey",shape:"dot",text:"closing"});
        });
        xmpp.on('close', async address => {
            node.status({fill:"grey",shape:"dot",text:"closed"});
        });
        xmpp.on('disconnecting', async address => {
            node.status({fill:"grey",shape:"dot",text:"disconnecting"});
        });
        // we'll not add a offline catcher, as the error catcher should populate the status for us
        
        // Should we listen on other's status (chatstate) or a chatroom state (groupbuddy)?
        xmpp.on('error', err => {
            if (RED.settings.verbose || LOGITALL) { node.log(err); }
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
                if (err.errno === "ENOTFOUND") {
                    node.error("Server doesn't exist "+xmpp.options.service,err);
                    node.status({fill:"red",shape:"ring",text:"bad address"});
                }
                else if (err === "XMPP authentication failure") {
                    node.error(err,err);
                    node.status({fill:"red",shape:"ring",text:"XMPP authentication failure"});
                }
                else {
                    node.error(err.errno,err);
                    node.status({fill:"red",shape:"ring",text:"node-red:common.status.error"});
                }
            }
        });

        // Meat of it, a stanza object contains chat messages (and other things)
        xmpp.on('stanza', async (stanza) =>{
            //      node.log("Received stanza");
            if (RED.settings.verbose || LOGITALL) {node.log(stanza);}
            if (stanza.is('message')) {
                if (stanza.attrs.type == 'chat') {
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
                else if(stanza.attrs.type == 'groupchat'){
                    const parts = stanza.attrs.from.split("/");
                    var conference = parts[0];
                    var from = parts[1];
                    var body = stanza.getChild('body');
                    var payload = "";
                    if("undefined" !== typeof body){
                        payload = body.getText();
                    }
                    var msg = { topic:from, payload:payload, room:conference };
                    if (stanza.attrs.from != node.nick) {
                        if ((node.join) && (node.from === conference)) {
                            node.send([msg,null]);
                        }
                    }
                }
            }
            else if(stanza.is('presence')){
                if(['subscribe','subscribed','unsubscribe','unsubscribed'].indexOf(stanza.attrs.type) > -1){
                    // this isn't for us, let the config node deal with it.

                }
                else{
                    var statusText="";
                    if(stanza.attrs.type === 'unavailable'){
                        // the user might not exist, but the server doesn't tell us that!
                        statusText = "offline";
                    }
                    var status = stanza.getChild('status');
                    if("undefined" !== typeof status){
                        statusText = status.getText();
                    }
                    // right, do we care if there's no status?
                    if(statusText !== ""){
                        var from = stanza.attrs.from;
                        var state = stanza.attrs.show;
                        var msg = {topic:from, payload: {presence:state, status:statusText} };
                        node.send([null,msg]);
                    }
                    else{
                        if (RED.settings.verbose || LOGITALL) {
                            node.log("not propagating blank status");
                            node.log(stanza);
                        }
                    }
                }
            }
        });



        // xmpp.on('subscribe', from => {
        //   xmpp.acceptSubscription(from);
        // });

        //register with config
        this.serverConfig.register(this);
        // Now actually make the connection
        try {
            if(xmpp.status === "online"){
                node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
            }
            else{
                node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
                if(xmpp.status === "offline"){
                    xmpp.start();
                }
            }
        }
        catch(e) {
            node.error("Bad xmpp configuration; service: "+xmpp.options.service+" jid: "+node.serverConfig.jid);
            node.warn(e);
            node.warn(e.stack);
            node.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
        }

        node.on("close", function(removed, done) {
            node.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
            node.serverConfig.deregister(node, done);
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

        /* connection states
           online: We are connected
           offline: disconnected and will not autoretry
           connecting: Socket is connecting
           connect: Socket is connected
           opening: Stream is opening
           open: Stream is open
           closing: Stream is closing
           close: Stream is closed
           disconnecting: Socket is disconnecting
           disconnect: Socket is disconnected
        */

        xmpp.on('online', function(data) {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
            if ((node.join) && (node.from !== "")) {
                // disable chat history
                var to = node.to+'/'+node.nick;
                // the presence with the muc x element signifies we want to join the muc
                // if we want to support passwords, we need to add that as a child of the x element
                // (third argument to the x/muc/children )
                // We also turn off chat history (maxstanzas 0) because that's not what this node is about.
                var stanza = xml('presence',
                                 {"to": to},
                                 xml("x",'http://jabber.org/protocol/muc'),
                                 { maxstanzas:0, seconds:1 }
                                );
                node.serverConfig.used(node);
                xmpp.send(stanza);
            }
        });

        xmpp.on('connecting', async address => {
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
        });
        xmpp.on('connect', async address => {
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connected"});
        });
        xmpp.on('opening', async address => {
            node.status({fill:"grey",shape:"dot",text:"opening"});
        });
        xmpp.on('open', async address => {
            node.status({fill:"grey",shape:"dot",text:"open"});
        });
        xmpp.on('closing', async address => {
            node.status({fill:"grey",shape:"dot",text:"closing"});
        });
        xmpp.on('close', async address => {
            node.status({fill:"grey",shape:"dot",text:"closed"});
        });
        xmpp.on('disconnecting', async address => {
            node.status({fill:"grey",shape:"dot",text:"disconnecting"});
        });
        // we'll not add a offline catcher, as the error catcher should populate the status for us

        xmpp.on('error', function(err) {
            if (RED.settings.verbose || LOGITALL) { node.log(err); }
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
                if (err.errno === "ENOTFOUND") {
                    node.error("Server doesn't exist "+xmpp.options.service,err);
                    node.status({fill:"red",shape:"ring",text:"bad address"});
                }
                else if (err === "XMPP authentication failure") {
                    node.error(err,err);
                    node.status({fill:"red",shape:"ring",text:"XMPP authentication failure"});
                }
                else {
                    node.error(err.errno,err);
                    node.status({fill:"red",shape:"ring",text:"node-red:common.status.error"});
                }
            }
        });

        //register with config
        this.serverConfig.register(this);
        // Now actually make the connection
        if(xmpp.status === "online"){
            node.status({fill:"green",shape:"dot",text:"online"});
        }
        else{
            node.status({fill:"grey",shape:"dot",text:"node-red:common.status.connecting"});
            if(xmpp.status === "offline"){
                xmpp.start().catch(error => {
                    node.error("Bad xmpp configuration; service: "+xmpp.options.service+" jid: "+node.serverConfig.jid);
                    node.warn(error);
                    node.warn(error.stack);
                    node.status({fill:"red",shape:"ring",text:"node-red:common.status.error"});
                });
            }
        }

        // Let's get down to business and actually send a message
        node.on("input", function(msg) {
            if (msg.presence) {
                if (['away', 'dnd', 'xa', 'chat'].indexOf(msg.presence) > -1 ) {
                    var stanza = xml('presence',
                                     {"show":msg.presence},
                                     xml('status',{},msg.payload));
                    node.serverConfig.used(node);
                    xmpp.send(stanza);
                }
                else { node.warn("Can't set presence - invalid value: "+msg.presence); }
            }
            else if(msg.command){
                if(msg.command === "subscribe"){
                    var stanza = xml('presence',
                                     {type:'subscribe', to: msg.payload});
                    node.serverConfig.used(node);
                    xmpp.send(stanza);
                }
            }
            else {
                var to = node.to || msg.topic || "";
                if (to !== "") {
                    var message;
                    var type = node.join? "groupchat":"chat";
                    if (node.sendAll) {
                        message = xml(
                            "message",
                            { type: type, to: to },
                            xml("body", {}, JSON.stringify(msg))
                        );

                    }
                    else if (msg.payload) {
                        if (typeof(msg.payload) === "object") {
                            message = xml(
                                "message",
                                { type: type, to: to },
                                xml("body", {}, JSON.stringify(msg.payload))
                            );
                        }
                        else {
                            message = xml(
                                "message",
                                { type: type, to: to },
                                xml("body", {}, msg.payload.toString())
                            );
                        }
                    }
                    node.serverConfig.used(node);
                    xmpp.send(message);
                }
            }
        });

        node.on("close", function(removed, done) {
            if (RED.settings.verbose || LOGITALL) {node.log("Closing");}
            node.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
            node.serverConfig.deregister(node, done);
        });
    }
    RED.nodes.registerType("xmpp out",XmppOutNode);
}
