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
    var m = require('mraa');
    //console.log("BOARD :",m.getPlatformName());

    function gpioDin(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        this.interrupt = n.interrupt;
        this.x = new m.Gpio(parseInt(this.pin));
        this.board = m.getPlatformName();
        var node = this;
        node.x.mode(m.PIN_GPIO);
        node.x.dir(m.DIR_IN);
        node.x.isr(m.EDGE_BOTH, function() {
            var g = node.x.read();
            var msg = { payload:g, topic:node.board+"/D"+node.pin };
            switch (g) {
                case 0:
                    node.status({fill:"green",shape:"ring",text:"low"});
                    if (node.interrupt=== "f" || node.interrupt === "b") {
                        node.send(msg);
                    }
                    break;
                case 1:
                    node.status({fill:"green",shape:"dot",text:"high"});
                    if (node.interrupt=== "r" || node.interrupt === "b") {
                        node.send(msg);
                    }
                    break;
                default:
                    node.status({fill:"grey",shape:"ring",text:"unknown"});
            }
        });
        switch (node.x.read()) {
            case 0:
                node.status({fill:"green",shape:"ring",text:"low"});
                break;
            case 1:
                node.status({fill:"green",shape:"dot",text:"high"});
                break;
            default:
                node.status({});
        }
        this.on('close', function() {
            node.x.isr(m.EDGE_BOTH, null);
        });
    }
    RED.nodes.registerType("mraa-gpio-din", gpioDin);
}
