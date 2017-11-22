
module.exports = function(RED) {
    "use strict";
    var dummyjson = require('dummy-json');

    function DataGeneratorNode(n) {
        RED.nodes.createNode(this,n);
        this.field = n.field || "payload";
        this.template = n.template;
        this.fieldType = n.fieldType || "msg";
        this.syntax = n.syntax || "text";
        var node = this;
        node.on("input", function(msg) {
            if (msg.seed) { dummyjson.seed = msg.seed; }
            try {
                var value = dummyjson.parse(node.template, {mockdata: msg});
                if (node.syntax === "json") {
                    try { value = JSON.parse(value); }
                    catch(e) { node.error(RED._("datagen.errors.json-error")); }
                }
                if (node.fieldType === 'msg') {
                    RED.util.setMessageProperty(msg,node.field,value);
                }
                else if (node.fieldType === 'flow') {
                    node.context().flow.set(node.field,value);
                }
                else if (node.fieldType === 'global') {
                    node.context().global.set(node.field,value);
                }
                node.send(msg);
            }
            catch(e) {
                node.error(e.message);
            }
        });
    }
    RED.nodes.registerType("data-generator",DataGeneratorNode);
    RED.library.register("datagenerator");
}
