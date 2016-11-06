
module.exports = function(RED) {
    "use strict";
    //The Server Definition - this opens (and closes) the connection
    function EmoncmsServerNode(n) {
        RED.nodes.createNode(this,n);
        this.server = n.server;
        this.name = n.name;
    }
    RED.nodes.registerType("emoncms-server",EmoncmsServerNode,{
        credentials: {
            apikey: {type:"text"}
        }
    });

    function Emoncms(n) {
        RED.nodes.createNode(this,n);
        this.emonServer = n.emonServer;
        var sc = RED.nodes.getNode(this.emonServer);

        this.baseurl = sc.server;
        this.apikey = sc.credentials.apikey;

        this.nodegroup = n.nodegroup || "";
        var node = this;
        var http;
        if (this.baseurl.substring(0,5) === "https") { http = require("https"); }
        else { http = require("http"); }
        this.on("input", function(msg) {
            this.url = this.baseurl + '/input/post.json?';
            if (typeof(msg.payload) !== "string") {
                this.url += 'json=' + JSON.stringify(msg.payload);
            }
            else {
                if (msg.payload.indexOf(':') > -1) {
                    this.url += 'json={' + msg.payload + '}';
                } else {
                    this.url += 'csv='+msg.payload;
                }
            }
            this.url += '&apikey='+this.apikey;
            var nodegroup = this.nodegroup || msg.nodegroup;
            if (nodegroup !== "") {
                this.url += '&node=' + nodegroup;
            }
            if (typeof msg.time !== 'undefined') {
                if (!isNaN(parseInt(msg.time))) { this.url += '&time=' + msg.time; }
            }
            http.get(this.url, function(res) {
                msg.rc = res.statusCode;
                msg.payload = "";
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    msg.payload += chunk;
                });
                res.on('end', function() {
                    if (msg.rc === 200) {
                        node.send(msg);
                    }
                });
            }).on('error', function(e) {
                node.error(e,msg);
            });
        });
    }
    RED.nodes.registerType("emoncms",Emoncms);

    function Emoncmsin(n) {
        RED.nodes.createNode(this,n);
        this.emonServer = n.emonServer;
        var sc = RED.nodes.getNode(this.emonServer);

        this.baseurl = sc.server;
        this.apikey = sc.credentials.apikey;

        this.feedid = n.feedid
        var node = this;
        var http;
        if (this.baseurl.substring(0,5) === "https") { http = require("https"); }
        else { http = require("http"); }
        this.on("input", function(msg) {
            this.url = this.baseurl + '/feed/value.json';
            this.url += '&apikey='+this.apikey;
            var feedid = this.feedid || msg.feedid;
            if (feedid !== "") {
                this.url += '&id=' + feedid;
            }
            http.get(this.url, function(res) {
                msg.rc = res.statusCode;
                msg.payload = "";
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    msg.payload += chunk;
                });
                res.on('end', function() {
                    if (msg.rc === 200) {
                        try {
                            msg.payload = JSON.parse(msg.payload);
                        } catch(err) {
                            // Failed to parse, pass it on
                        }
                        node.send(msg);
                    }
                });
            }).on('error', function(e) {
                node.error(e,msg);
            });
        });
    }
    RED.nodes.registerType("emoncms in",Emoncmsin);
}
