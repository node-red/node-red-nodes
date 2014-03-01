    /**
     * Copyright 2013 IBM Corp.
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
    var RED = require(process.env.NODE_RED_HOME+"/red/red");
    var growl = require('growl');
    var util = require("util");
    var events = require("events");

    function DesktopNotifyNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.title = n.title;
        this.active = (n.active == null)||n.active;
        this.maxlength = parseInt(n.maxlength) || 200;

        this.on("input",function(msg) {
            if (this.active) {
                if (msg.payload instanceof Buffer) {
                    msg.payload = "(Buffer) "+msg.payload.toString();
                }

                if (typeof msg.payload !== "undefined") {
                    DesktopNotifyNode.send(this, msg.payload);
                }
            }
        });
    }

    RED.nodes.registerType("desktopnotify",DesktopNotifyNode);

DesktopNotifyNode.send = function(self, msg) {
    var title = self.title;

    if (msg instanceof Error) {
        title += " [ERROR]: ";
    } else if (typeof msg === 'object') {
        title += " [OBJECT]: ";
    }

    msg = msg.toString();

    if (msg.length > self.maxlength) {
        msg = msg.substr(0,self.maxlength) +"...";
    }

    growl(msg, { title: title });
}
