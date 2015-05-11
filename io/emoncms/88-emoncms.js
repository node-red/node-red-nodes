/**
 * Copyright 2013 Henrik Olsson henols@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

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
            if (msg.payload.indexOf(':') > -1) {
                this.url += 'json={' + msg.payload + '}';
            } else {
                this.url += 'csv='+msg.payload;
            }
            this.url += '&apikey='+this.apikey;
            var nodegroup = this.nodegroup || msg.nodegroup;
            if (nodegroup !== "") {
                this.url += '&node=' + nodegroup;
            }
            if (typeof msg.time !== 'undefined') {
                this.url += '&time=' + msg.time;
            }
            node.log("[emoncms] "+this.url);
            http.get(this.url, function(res) {
                node.log("Http response: " + res.statusCode);
                msg.rc = res.statusCode;
                msg.payload = "";
                if ((msg.rc != 200) && (msg.rc != 404)) {
                    node.send(msg);
                }
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    msg.payload += chunk;
                });
                res.on('end', function() {
                    node.send(msg);
                });
            }).on('error', function(e) {
                // node.error(e);
                msg.rc = 503;
                msg.payload = e;
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("emoncms",Emoncms);
}
