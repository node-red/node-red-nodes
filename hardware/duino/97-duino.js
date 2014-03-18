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

var duino = require("duino");
var util =  require('util');

function DuinoNode(n) {
	RED.nodes.createNode(this,n);
	this.pin = n.pin || "10";
	node = this;
    try {
	    this.board = new duino.Board();
    }
    catch (e) {
        util.log("[duino] - Error establishing board connection!");
    }
	
	this.on("input", function(message) {
		if (typeof(message.payload) == "string") {
			message.payload = JSON.parse(message.payload);
		}
		// Send message as RC triState
		if (message.payload.inputType === "RC") {
			var rcCode = message.payload.rcCode;
			util.log("RCCode = "+ rcCode);
			if (rcCode.length != 8) {
				util.log("[duino] - Error, code  : "+rcCode+ "was not 8 digits long!");
				return;
			}
			var rcRef = new duino.RC({
				board: node.board,
				pin: parseInt(node.pin, 10)
			});

			if (message.payload.on) {
				rcRef.triState(message.payload.rcCode + "FFFF");
			}
			else {
				rcRef.triState(message.payload.rcCode + "FFF0");
			}
		}

	});

}
RED.nodes.registerType("duino",DuinoNode);
