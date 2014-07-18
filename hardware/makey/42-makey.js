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
    var hids = require('hidstream');

    function MakeyNode(n) {
        RED.nodes.createNode(this,n);
        this.vid = 0x1b4f;      // MakeyMakey vendor ID
        this.pid = 0x2b75;      // MakeyMakey product ID
        var node = this;
        var path = null;
        var tout;
        var click = false;
        var keylookup = { "44":"space", "82":"up", "81":"down", "79":"right", "80":"left",
                            "26":"w", "4":"a", "22":"s", "7":"d", "9":"f", "10":"g" };

        var findmakey = function() {
            node.log("looking for MakeyMakey");
            var devices = hids.getDevices();
            for (var dev = 0; dev < devices.length; dev++) {
                //node.log("Find:"+devices[dev].vendorId.toString(16)+":"+devices[dev].productId.toString(16));
                if ((devices[dev].vendorId == node.vid) && (devices[dev].productId == node.pid)) {
                    path = devices[dev].path;
                    node.log("found MakeyMakey at: "+path);     //path = "0003:0004:00";
                    break; // stop on first match
                }
            }
            if (path === null) {
                tout = setTimeout( function () {
                    findmakey();
                },15000);
            }
        }
        findmakey();

        if (path != null) {
            try {
                node.makey = new hids.device(path);
                node.makey.on("data", function(key) {
                    var msg = {payload:[]};
                    //console.log(key);
                    if (key.modKeys[0] === "shift") {
                        for (var keys = 0; keys < key.keyCodes.length; keys++) {
                            node.log(key.keyCodes[keys]+" : "+keylookup[key.keyCodes[keys].toString()]);
                            msg.payload.push(keylookup[key.keyCodes[keys].toString()]);
                        }
                        msg.payload = msg.payload.join();
                        node.send(msg);
                    }
                    else if (key.modKeys[0] === "ctrl") {
                        if (key.charCodes.length === 0) {
                            click = !click;
                            msg.payload = (click) ? "click" : "clock";
                            node.send(msg);
                        }
                    }
                    else { console.log(key); }
                });
            } catch(err) { node.warn("can't open MakeyMakey: Do you need root access ?"); }
        }
        else {
            findmakey();
        }

        this.on("close", function() {
            if (tout) { clearTimeout(tout); }
            if (node.makey) { node.makey.device.close(); }
        });
    }
    RED.nodes.registerType("makeymakey",MakeyNode);
}
