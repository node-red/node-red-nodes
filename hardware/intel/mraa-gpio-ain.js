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

    function gpioAin(n) {
        RED.nodes.createNode(this, n);
        this.pin = n.pin;
        this.interval = n.interval;
        this.x = new m.Aio(parseInt(this.pin));
        this.board = m.getPlatformName();
        var node = this;
        var msg = { topic:node.board+"/A"+node.pin };
        var old = -99999;
        this.timer = setInterval(function() {
            msg.payload = node.x.read();
            if (msg.payload !== old) {
                node.send(msg);
                old = msg.payload;
            }
        }, node.interval);

        this.on('close', function() {
            clearInterval(this.timer);
        });
    }
    RED.nodes.registerType("mraa-gpio-ain", gpioAin);
}
