
module.exports = function(RED) {
    "use strict";

    function MdnsNode(n) {
        var mdns = require('mdns');
        if (process.platform === "linux") {
            RED.log.info("You may ignore the warning about Bonjour compatability.");
        }
        RED.nodes.createNode(this, n);
        this.topic = n.topic || "";
        this.service = n.service;
        // var sequence = [
        //     mdns.rst.DNSServiceResolve(),
        //     mdns.rst.getaddrinfo({families: [4] })
        // ];
        // var browser = mdns.createBrowser(this.service,{resolverSequence: sequence});
        var browser = mdns.createBrowser(this.service);
        var node = this;

        browser.on('serviceUp', function(service) {
            if (RED.settings.verbose) { node.log("here : " + service.name); }
            service.state = true;
            var msg = {topic:node.topic, payload:service};
            node.send(msg);
        });
        browser.on('serviceDown', function(service) {
            if (RED.settings.verbose) { node.log("away : " + service.name); }
            service.state = false;
            var msg = {topic:node.topic, payload:service};
            node.send(msg);
        });
        browser.start();

        node.on("close", function() {
            if (browser) { browser.stop(); }
        });
    }
    RED.nodes.registerType("discovery", MdnsNode);


    function MdnsAnnNode(n) {
        var mdns = require('mdns');
        var os = require("os");
        if (process.platform === "linux") {
            RED.log.info("You may ignore the warning about Bonjour compatability.");
        }
        RED.nodes.createNode(this, n);
        this.service = n.service || "";
        this.port = n.port;
        this.name = n.name;
        this.txt = n.txt;
        if (this.txt && (this.txt !== '')) {
            try { this.txt = JSON.parse('{'+this.txt+'}'); }
            catch (e) { delete this.txt; }
        }
        var node = this;

        this.on("input", function(msg) {
            if ((msg.payload === 0) || (msg.payload === "0")) {
                node.ad.stop();
            }
            else {
                var service = node.service || msg.service;
                var port = Number(node.port || msg.port);
                var options = {};
                if (node.name || msg.name) {
                    options.name = (node.name || msg.name).replace(/\%h/g, os.hostname());
                }
                if (node.txt || msg.txtRecord) { options.txtRecord = node.txt || msg.txtRecord }
                node.ad = mdns.createAdvertisement(service, port, options);
                node.ad.start();
            }
        });

        this.on("error", function(e) {
            node.error(e);
        });

        this.on("close", function() {
            if (node.ad) { node.ad.stop(); }
        });

    }
    RED.nodes.registerType("announce", MdnsAnnNode);
}
