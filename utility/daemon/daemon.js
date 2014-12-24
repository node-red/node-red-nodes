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
    var spawn = require('child_process').spawn;

    function DaemonNode(n) {
        RED.nodes.createNode(this,n);
        this.cmd = n.command;
        this.args = n.args.split(" ") || [];
        this.cr = n.cr;
        this.op = n.op;
        this.redo = n.redo;
        this.running = false;
        var node = this;

        function inputlistener(msg) {
            if (msg != null) {
                if (!Buffer.isBuffer(msg.payload)) {
                    if (typeof msg.payload === "object") { msg.payload = JSON.stringify(msg.payload); }
                    if (typeof msg.payload !== "string") { msg.payload = msg.payload.toString(); }
                    if (node.cr === true) { msg.payload += "\n"; }
                }
                if (RED.settings.verbose) { node.log("inp: "+msg.payload); }
                if (node.child !== null) { node.child.stdin.write(msg.payload); }
                else { node.warn("Command not running"); }
            }
        }

        function runit() {
            node.child = spawn(node.cmd, node.args);
            if (RED.settings.verbose) { node.log(node.cmd+" "+JSON.stringify(node.args)); }
            node.status({fill:"green",shape:"dot",text:"running"});
            node.running = true;

            node.on("input", inputlistener);

            node.child.stdout.on('data', function (data) {
                if (node.op == "string") { data = data.toString(); }
                if (node.op == "number") { data = Number(data); }
                if (RED.settings.verbose) { node.log("out: "+data); }
                if (data && data.trim() !== "") {
                    var msg = {payload:data};
                    node.send([msg,null,null]);
                }
            });

            node.child.stderr.on('data', function (data) {
                if (node.op == "string") { data = data.toString(); }
                if (node.op == "number") { data = Number(data); }
                if (RED.settings.verbose) { node.log("err: "+data); }
                var msg = {payload:data};
                node.send([null,msg,null]);
            });

            node.child.on('close', function (code) {
                if (RED.settings.verbose) { node.log("ret: "+code); }
                var msg = {payload:code};
                node.send([null,null,msg]);
                node.child = null;
                node.running = false;
                node.status({fill:"red",shape:"ring",text:"stopped"});
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.warn('Command not found'); }
                else if (err.errno === "EACCES") { node.warn('Command not executable'); }
                else { node.log('error: ' + err); }
                node.status({fill:"grey",shape:"dot",text:"error"});
            });
        }

        if (node.redo === true) {
            var loop = setInterval( function() {
                if (!node.running) {
                    node.removeListener('input', inputlistener);
                    node.warn("Restarting : " + node.cmd);
                    runit();
                }
            }, 10000);  // Restart after 10 secs if required
        }

        node.on("close", function() {
            if (node.child != null) { node.child.kill('SIGKILL'); }
            if (RED.settings.verbose) { node.log(node.cmd+" stopped"); }
            clearInterval(loop);
        });

        runit();
    }
    RED.nodes.registerType("daemon",DaemonNode);
}
