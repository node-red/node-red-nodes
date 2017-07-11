(function() {
  module.exports = function(RED) {
    var NMACredentialsNode, NMANotificationNode, mustache, nma;
    mustache = require("mustache");
	nma = require('nma');
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
			}, function (error) {
				if (error) {
					return node.status({
					  shape: "dot",
					  fill: "red",
					  text: "error!"
					});
					node.error("NMA error: " + error,msg);
				} else {
					return node.status({});
				}
			});

          return node.send(msg);
        };
      })(this));
	  
    };
    RED.nodes.registerType("NMA-credentials", NMACredentialsNode);
    return RED.nodes.registerType("NMA-notification", NMANotificationNode);
  };

}).call(this);
