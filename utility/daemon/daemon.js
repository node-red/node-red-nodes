
module.exports = function(RED) {
    "use strict";
    var spawn = require('child_process').spawn;

    function DaemonNode(n) {
        RED.nodes.createNode(this,n);
        this.cmd = n.command;
        this.args = n.args.trim().split(" ") || [];
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
            var line = "";

            node.on("input", inputlistener);

            node.child.stdout.on('data', function (data) {
                if (node.op === "string") { data = data.toString(); }
                if (node.op === "number") { data = Number(data); }
                if (RED.settings.verbose) { node.log("out: "+data); }
                if (node.op === "lines") {
                    line += data.toString();
                    var bits = line.split("\n");
                    while (bits.length > 1) {
                        node.send([{payload:bits.shift()},null,null]);
                    }
                    line = bits[0];
                } else {
                    if (data && (data.length !== 0)) {
                        node.send([{payload:data},null,null]);
                    }
                }
            });

            node.child.stderr.on('data', function (data) {
                if (node.op === "string") { data = data.toString(); }
                if (node.op === "number") { data = Number(data); }
                if (RED.settings.verbose) { node.log("err: "+data); }
                node.send([null,{payload:data},null]);
            });

            node.child.on('close', function (code) {
                if (RED.settings.verbose) { node.log("ret: "+code); }
                node.send([null,null,{payload:code}]);
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
            node.status({});
        });

        runit();
    }
    RED.nodes.registerType("daemon",DaemonNode);
}
