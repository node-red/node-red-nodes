/**
 * Copyright 2013 IBM Corp.
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

var RED = require(process.env.NODE_RED_HOME+"/red/red");
var PushOver = require('pushover-notifications');
var util = require('util');


try {
	var pushovercredentials = RED.settings.pushover || require(process.env.NODE_RED_HOME+"/../pushovercredentials.js");
}
catch(err) {
	util.log("[57-pushover.js] Error: Failed to load Pushover credentials");
}

if (pushovercredentials) {
	var pusher = new PushOver( {
    		user: pushovercredentials.userkey,
    		token: pushovercredentials.token,
	});
}

function PushoverNode(n) {
	RED.nodes.createNode(this,n);
	this.title = n.title;
	var node = this;
	this.on("input",function(msg) {
		var titl = this.title||msg.topic||"Node-RED";
		if (typeof(msg.payload) == 'object') {
			msg.payload = JSON.stringify(msg.payload);
		}
		if (pushovercredentials) {
			var pomsg = {
				message: msg.payload,
				title: titl,
				sound: 'magic',
				priority: 1
			};
			try {
				//pusher.note(deviceId, titl, msg.payload, function(err, response) {
				pusher.send( pomsg, function(err, response) {
					if (err) node.error(err);
					console.log(response);
				});
			}
			catch (err) {
				node.error(err);
			}
		}
		else {
			node.warn("Pushover credentials not set/found. See node info.");
		}
	});
}

RED.nodes.registerType("pushover",PushoverNode);
