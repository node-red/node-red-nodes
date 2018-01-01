
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
        this.datatype = n.datatype || "";
        var node = this;
        var http;
        if (this.baseurl.substring(0,5) === "https") { http = require("https"); }
        else { http = require("http"); }
        this.on("input", function(msg) {
            // setup the data for the URI
            if (this.datatype == "legacy"){
                this.url = this.baseurl + '/input/post.json?';
                if (typeof(msg.payload) !== "string") {
                    this.url += 'json=' + JSON.stringify(msg.payload);
                }
                else {
                    if (msg.payload.indexOf(':') > -1) {
                        this.url += 'json={' + msg.payload + '}';
                    }
                    else {
                        this.url += 'csv=' + msg.payload;
                    }
                }
            }
            else if (this.datatype == "fulljson"){
                this.url = this.baseurl + '/input/post?';
                this.url += 'fulljson=' + encodeURIComponent(JSON.stringify(msg.payload));
            }
            else if (this.datatype == "json"){
                this.url = this.baseurl + '/input/post?';
                this.url += 'json={' + encodeURIComponent(msg.payload) + '}';
            }
            else if (this.datatype == "CSV"){
                this.url = this.baseurl + '/input/post?';
                this.url += 'csv=' + msg.payload;
            }
            else {
                node.send("ERROR : No valid data type set - " + this.datatype);
            }

            // setup the API key for URI.
            this.url += '&apikey=' + this.apikey;

            // setup the node group for URI
            var nodegroup = this.nodegroup || msg.nodegroup;
            if (nodegroup !== "") {
                this.url += '&node=' + nodegroup;
            }

            // check for a time object and setup URI if valid
            if (typeof msg.time !== 'undefined') {
                if (!isNaN(msg.time)) { 
                    this.url += '&time=' + msg.time;
                }
                else {
                    if (isNaN(Date.parse(msg.time))) {
                        // error condition
                        node.send("ERROR: Time object not valid - " + msg.time);
                    } else {
                        this.url += '&time=' + Date.parse(msg.time)/1000;
                    }
                }
                delete msg.time; // clean it up for the error msg
            }
            // debug info - uncomment if needed
            // node.send("INFO: URI sent (decoded) - " + decodeURIComponent(this.url));

            http.get(this.url, function(res) {
                msg.topic = "http response";
                msg.rc = res.statusCode;
                msg.payload = "";
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    msg.payload += chunk;
                });
                res.on('end', function() { //always send response from node as a 200 does not mean data input sucess
                        try {
                            msg.payload = JSON.parse(msg.payload);
                        }
                        catch(err) {
                            // Failed to parse, pass it on
                        }
                        node.send(msg);
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
                        }
                        catch(err) {
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
