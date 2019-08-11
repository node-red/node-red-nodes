
module.exports = function(RED) {
    "use strict";
    var notifier = require('node-notifier');
    var path = require('path');
    var fs = require('fs');
    var image = path.join(__dirname, "/node-red.png");

    function NotifyNode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        var node = this;

        node.on("input",function(msg) {
            var title = node.title || msg.topic;
            if (typeof msg.payload === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            var icon = image;
            if (msg.icon) {
                if (fs.existsSync(msg.icon)) { icon = msg.icon; }
                else { node.error("Bad Icon file: "+msg.icon,msg); }
            }
            var icon = msg.icon || image;
            if (typeof(title) !== 'undefined') {
                notifier.notify({ message:msg.payload, title:title, icon:icon });
            }
            else {
                notifier.notify({ message:msg.payload, icon:imagefile });
            }
        });
    }

    RED.nodes.registerType("nnotify",NotifyNode);
}
