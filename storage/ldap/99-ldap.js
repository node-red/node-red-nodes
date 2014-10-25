// Copyright 2013,2014 IBM Corp.

//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at

//   http://www.apache.org/licenses/LICENSE-2.0

//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

module.exports = function(RED) {
	"use strict";
	var LDAP = require("LDAP");
	var mustache = require("mustache");

	var connection;

	function ldapNode(n) {
		RED.nodes.createNode(this,n);

		this.server = n.server;
		this.port = n.port;
		this.tls = n.tls;
		if (this.credentials) {
            this.binddn = this.credentials.binddn;
            this.password = this.credentials.password;
        }
	}

	RED.nodes.registerType("ldap",ldapNode,{
        credentials: {
            binddn: {type:"text"},
            password: {type: "password"}
        }
    });

	function LDAPOutNode(n) {
		RED.nodes.createNode(this,n);
		this.server = n.server;
		this.base = n.base;
		this.filter = n.filter;
		this.topic = n.topic;
		this.ldapServer = RED.nodes.getNode(this.server);
		var credentials = RED.nodes.getCredentials(this.server);
		if (this.ldapServer) {
			this.status({fill:"red",shape:"ring",text:"disconnected"});
			var ldapOptions = {
				uri:'ldap://' + this.ldapServer.server,
				version: 3,
				starttls: this.ldapServer.tls,
				connectiontimeout: 1,
				reconnect: true

			};
			if (this.ldapServer.tls) {
				if (this.ldapServer.port !== 636) {
					ldapOptions.uri = ldapOptions.uri + ":" + this.ldapServer.port;
				}
			} else {
				if (this.ldapServer.port !== 389) {
					ldapOptions.uri = ldapOptions.uri + ":" + this.ldapServer.port;
				}
			}

			this.ldap = new LDAP(ldapOptions);
			var node = this
			this.status({fill:"red",shape:"ring",text:"disconnected"});
			this.ldap.open(function(err){
				if (err) {
					node.error("error opening connection to " + node.ldapServer.server +"\n" + err);
					node.status({fill:"red",shape:"ring",text:"disconnected"});
					return;
				}

				node.status({fill:"green",shape:"dot",text:"connected"});
				node.connected = true;

				if (credentials && credentials.binddn && credentials.password) {
					var bindOptions = {
						binddn: credentials.binddn,
						password: credentials.password
					};

					node.ldap.simplebind(bindOptions, function(err){
						if (err) {
							node.error("failed to bind - " + err);
						} else {
							node.status({fill:"green",shape:"dot",text:"bound"});
						}
					});
				}

			});
			this.on('input', function(msg){
				if (node.connected) {
					var options = {
						base: node.base,
						scope: '',
						filter: mustache.render(node.filter,msg),
						attrs: ''
					};
					node.ldap.search(options, function(err,data){
						if (node.topic) {
							msg.topic = node.topic;
						}

						msg.payload = data;
						node.send(msg);
					});
				} else {
					node.error("not connected");
				}
			});
			this.on('close',function() {
				if(node.ldap) {
					node.ldap.close();
				}
			});
		}
	}

	RED.nodes.registerType("ldap out",LDAPOutNode);
}