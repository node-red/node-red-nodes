/**
 * Copyright 2015 IBM Corp.
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
        var browser = mdns.createBrowser(this.service);
        var node = this;

        browser.on('serviceUp', function (service) {
            if (RED.settings.verbose) { node.log("here : " + service.name); }
            service.state = true;
            var msg = {topic: node.topic, payload: service};
            node.send(msg);
        });
        browser.on('serviceDown', function (service) {
            if (RED.settings.verbose) { node.log("away : " + service.name); }
            service.state = false;
            var msg = {topic: node.topic, payload: service};
            node.send(msg);
        });
        browser.start();

        node.on("close", function () {
            if (browser) { browser.stop(); }
        });
    }

    RED.nodes.registerType("discovery", MdnsNode);
}
