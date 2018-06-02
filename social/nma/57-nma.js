(function() {
  module.exports = function(RED) {
    var NMACredentialsNode, NMANotificationNode, mustache, nma;
    mustache = require("mustache");
	nma = require('nma');
	var xml2js = require('xml2js');
	var parseString = xml2js.parseString;

    NMACredentialsNode = function(config) {
      var node;
      RED.nodes.createNode(this, config);
      node = this;
      return this.pushkey = config.pushkey;
    };
    NMANotificationNode = function(config) {
      var key, node, value;
      RED.nodes.createNode(this, config);
      node = this;
      for (key in config) {
        value = config[key];
        node[key] = value;
      }
      this.broker = config.broker;
      this.credentials = RED.nodes.getNode(this.broker);
      this.pushkey = this.credentials.pushkey;
	  
      return this.on('input', (function(_this) {
        return function(msg) {
          var body, req, request;
          node.status({
            fill: "grey",
            shape: "dot",
            text: "processing"
          });
		  
		var pri = msg.priority || node.priority || 0;
		if (pri > 2) pri = 2;
		if (pri < -2) pri = -2;
		  
		  nma({
				"apikey": node.pushkey,
				"application": mustache.render(node.application, msg) || msg.topic || "",
				"event": mustache.render(node.event, msg) || msg.event || "",
				"description": mustache.render(node.description, msg) || msg.payload || "",
				"priority": pri,
				"url": msg.url || node.url,
				"content-type": msg.content_type || node.content_type
			}, function (error, response, body) {
				//node.warn(response);
				//node.warn(body);
				
				var bodyObj;
				msg.payload = {};
				
				parseString(body, function (err, result) {
					if (err) { node.error(err, msg); }
					else {
						bodyObj = result;
						//node.send(msg);
					}
				});
				
				if (error) {
					
					error = bodyObj.nma.error[0]._;
					
					node.error("NMA " + error);
					
					msg.payload.code = bodyObj.nma.error[0].$.code;
					msg.payload.message = bodyObj.nma.error[0]._;
					if (bodyObj.nma.error[0].$.remaining) msg.payload.remaining = bodyObj.nma.error[0].$.remaining;
					if (bodyObj.nma.error[0].$.resettimer) msg.payload.resettimer = bodyObj.nma.error[0].$.resettimer;
					msg.payload.isError = true;
					
					node.status({
					  shape: "dot",
					  fill: "red",
					  text : "Error: " + error 
					});
					
				} else {
					msg.payload.code = bodyObj.nma.success[0].$.code;
					msg.payload.remaining = bodyObj.nma.success[0].$.remaining;
					msg.payload.resettimer = bodyObj.nma.success[0].$.resettimer;
					msg.payload.isError = false;
					
					node.status({
					  shape: "dot",
					  fill: "green",
					  text : "Success: " + msg.payload.remaining + " messages remaining in the next " + msg.payload.resettimer + " minutes"
					});
				}
				
				//msg.payload = bodyObj;
				node.send(msg);
				
			});

          //return node.send(msg);
        };
      })(this));
	  
    };
    RED.nodes.registerType("NMA-credentials", NMACredentialsNode);
    return RED.nodes.registerType("NMA-notification", NMANotificationNode);
  };

}).call(this);
