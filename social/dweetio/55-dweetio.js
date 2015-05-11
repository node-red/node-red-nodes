/**
 * Copyright 2014 IBM Corp.
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
    var DweetClient = require("node-dweetio");
    var dweetio = null;

    function DweetioOutNode(n) {
        RED.nodes.createNode(this,n);
        this.thing = n.thing;
        if (dweetio == null) { dweetio = new DweetClient(); }
        var node = this;

        this.on("input",function(msg) {
            //if (typeof(msg.payload) === 'object') {
            var thing = node.thing || msg.thing;
            try {
                dweetio.dweet_for(thing, {payload:msg.payload}, function(err, dweet) {
                        //console.log(dweet.thing); // "my-thing"
                        //console.log(dweet.content); // The content of the dweet
                        //console.log(dweet.created); // The create date of the dweet
                    });
            }
            catch (err) {
                node.log(err);
            }
            //} else { node.warn("Dweetio only sends payload objects."); }
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
                dweet.payload=dweet.content.payload;
            } else {
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
