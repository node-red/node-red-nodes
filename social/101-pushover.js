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

// Sample Node-RED node file

// Require main module
var RED = require("../../red/red");
var push = require("pushover-notifications");
var p = new push( {
 user: 'uMpXbvM81fMGbu4LD4v7oVJ6a6LZTr',
        token: 'aDHzbDqiYnwER8JeUsVZE1hVXcwGtq',
	debug: false
});


// The main node definition - most things happen in here
function pushoverNode(n) {      
    	// Create a RED node

    	RED.nodes.createNode(this,n);

    	// Store local copies of the node configuration (as defined in the .html)
	this.name = n.name;
    	this.title = n.title;
	this.priority = n.priority;	
	//Set up message
    	var push_msg = {};

	push_msg.title = n.title;
	push_msg.priority = n.priority;
	this.node = this;

	this.on("input",function(msg){
	try{

push_msg.message = msg.payload;

if (msg.title){
push_msg.title = msg.title;
}

if (msg.priority)
{
push_msg.priority = msg.priority;
}


		p.send(push_msg,function(err,response){
		if (err) node.error(err);
		console.log(response);
		});
	this.send(push_msg);
	}
	catch (err)
	{
	node.error(err);
	}
	});
};


// Register the node by name. This must be called before overriding any of the
// Node functions.
RED.nodes.registerType("pushover",pushoverNode);

