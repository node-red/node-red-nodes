
module.exports = function(RED) {
    "use strict";
    var DweetClient = require("node-dweetio");
    var dweetio = null;

    function DweetioOutNode(n) {
        RED.nodes.createNode(this,n);
        this.thing = n.thing;
        if (dweetio == null) { dweetio = new DweetClient(); }
        var node = this;

        var isObject = function(a) {
            if ((typeof(a) === "object") && (!Buffer.isBuffer(a)) && (!Array.isArray(a))) { return true; }
            else { return false; }
        };

        this.on("input",function(msg) {
            if (!isObject(msg.payload)) {
                msg.payload = {payload:msg.payload};
            }
            var thing = node.thing || msg.thing;
            try {
                dweetio.dweet_for(thing, msg.payload, function(err, dweet) {
                        //console.log(dweet.thing);   // "my-thing"
                        //console.log(dweet.content); // The content of the dweet
                        //console.log(dweet.created); // The create date of the dweet
                    });
            }
            catch (err) {
                node.log(err);
            }
        });

    }
    RED.nodes.registerType("dweetio out",DweetioOutNode);

    function DweetioInNode(n) {
        RED.nodes.createNode(this,n);
        this.thing = n.thing;
        if (dweetio == null) { dweetio = new DweetClient(); }
        var node = this;

        dweetio.listen_for(node.thing, function(dweet) {
            // This will be called anytime there is a new dweet for my-thing
            if (dweet.content.hasOwnProperty("payload")) {
                dweet.payload = dweet.content.payload;
            }
            else {
                dweet.payload = dweet.content;
            }
            delete dweet.content;
            node.send(dweet);
        });

        this.on("close", function() {
            dweetio.stop_listening_for(node.thing);
        });

    }
    RED.nodes.registerType("dweetio in",DweetioInNode);
}
