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

module.exports = function(RED) {
    "use strict";
    var spawn = require('child_process').spawn;
    var plat = require('os').platform();

    function PingNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.timer = n.timer * 1000;
        var node = this;

        node.tout = setInterval(function() {
            var ex;
            if (plat == "linux") { ex = spawn('ping', ['-n', '-w', '5', '-c', '1', node.host]); }
            else if (plat.match(/^win/)) { ex = spawn('ping', ['-n', '1', '-w', '5000', node.host]); }
            else if (plat == "darwin") { ex = spawn('ping', ['-n', '-t', '5', '-c', '1', node.host]); }
            else { node.error("Sorry - your platform - "+plat+" - is not recognised."); }
            var res = false;
            ex.stdout.on('data', function (data) {
                //console.log('[ping] stdout: ' + data.toString());
                var regex = /from.*time.(.*)ms/;
                var m = regex.exec(data.toString())||"";
                if (m !== '') { res = Number(m[1]); }
            });
            ex.stderr.on('data', function (data) {
                //console.log('[ping] stderr: ' + data);
            });
            ex.on('close', function (code) {
                //console.log('[ping] result: ' + code);
                var msg = { payload:false, topic:node.host };
                if (code === 0) { msg = { payload:res, topic:node.host }; }
                node.send(msg);
            });
        }, node.timer);

        this.on("close", function() {
            clearInterval(this.tout);
        });
    }
    RED.nodes.registerType("ping",PingNode);
}
