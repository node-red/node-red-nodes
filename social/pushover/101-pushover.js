// Pushover Node-Red File

// Require main module and pushover npm
var RED = require(process.env.NODE_RED_HOME+"/red/red");
var push = require("pushover-notifications");


// Add a line like this to settings.js:
//    pushover: {user:'My-API-KEY', token:'MY-TOKEN-KEY},


try {
	var pushoverkey = RED.settings.pushover;
}
catch(err) {
	util.log("[pushover.js] Error: Failed to load Push Over credentials");
}


}



//Create new push object
if (pushoverkey) {
var p = new push({
user: pushoverkey.user,
token: pushoverkey.token,
});
}


//Main function
function pushoverNode(n) {      

    	// Create a RED node
    	RED.nodes.createNode(this,n);

    	// Store local copies of the node configuration
	this.name = n.name;
    	this.title = n.title;
	this.priority = n.priority;	
	
	//Create a push message object
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


// Register the node
RED.nodes.registerType("pushover",pushoverNode);


