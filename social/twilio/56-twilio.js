/**
 * Copyright 2013 Andrew D Lindsay @AndrewDLindsay
 * http://blog.thiseldo.co.uk
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
var util = require('util');

// Either add a line like this to settings.js
//   twilio: { account:'My-ACCOUNT-SID', authtoken:'TWILIO-TOKEN',from:'FROM-NUMBER' },
// Or as a twiliokey.js file in the directory ABOVE node-red.
//   module.exports = { account:'My-ACCOUNT-SID', authtoken:'TWILIO-TOKEN',from:'FROM-NUMBER' }

try {
	var twiliokey = require(process.env.NODE_RED_HOME+"/settings").twilio || require(process.env.NODE_RED_HOME+"/../twiliokey.js");
}
catch(err) {
	util.log("[56-twilio.js] Error: Failed to load Twilio credentials");
}

if (twiliokey) {
	var twilioClient = require('twilio')(twiliokey.account, twiliokey.authtoken);
	var fromNumber = twiliokey.from;
}

function TwilioOutNode(n) {
	RED.nodes.createNode(this,n);
	this.title = n.title;
	var node = this;
	this.on("input",function(msg) {
		if (typeof(msg.payload) == 'object') {
			msg.payload = JSON.stringify(msg.payload);
		}
		if (twiliokey) {
			try {
				// Send SMS
				twilioClient.sendMessage( {to: msg.topic, from: fromNumber, body: msg.payload}, function(err, response) {
					if (err) node.error(err);
					//console.log(response);
				});
			}
			catch (err) {
				node.error(err);
			}
		}
		else {
			node.warn("Twilio credentials not set/found. See node info.");
		}
	});
}

RED.nodes.registerType("twilio out",TwilioOutNode);
