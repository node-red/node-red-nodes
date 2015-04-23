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
    var Controller = require('node-pid-controller');

    function PIDcontrolNode(n) {
        RED.nodes.createNode(this,n);
        this.target = n.target;
        this.kp = n.kp;
        this.ki = n.ki;
        this.kd = n.kd;
        var node = this;
        node.ctr = new Controller(node.kp, node.ki, node.kd);
        node.ctr.setTarget(node.target);
        this.status({fill:"blue",shape:"dot",text:"set point:"+node.target});
        var tgt = node.target;

        this.on("input",function(msg) {
            if (msg.hasOwnProperty("setpoint")) {
                tgt = Number(msg.setpoint);
                node.ctr.setTarget(tgt);
                this.status({fill:"blue",shape:"dot",text:"set point:"+tgt});
            }
            else if (!isNaN(msg.payload)) {
                msg.payload = node.ctr.update(Number(msg.payload));
                msg.topic = "pid";
                node.send(msg);
            }
            else { node.warn("Non numeric input"); }
        });
    }
    RED.nodes.registerType("PID control",PIDcontrolNode);
}
