
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
        this.closer = n.closer || "SIGKILL";
        this.autorun = true;
        if (n.autorun === false) { this.autorun = false; }
        var node = this;
        var lastmsg = {};

        function inputlistener(msg) {
            if (msg != null) {
                if (msg.hasOwnProperty("kill") && node.running) {
                    if (typeof msg.kill !== "string" || msg.kill.length === 0 || !msg.kill.toUpperCase().startsWith("SIG") ) { msg.kill = "SIGINT"; }
                    node.child.kill(msg.kill.toUpperCase());
                }
                else if (msg.hasOwnProperty("start") && !node.running) {
                    runit();
                }
                else {
                    if (!Buffer.isBuffer(msg.payload)) {
                        if (typeof msg.payload === "object") { msg.payload = JSON.stringify(msg.payload); }
                        if (typeof msg.payload !== "string") { msg.payload = msg.payload.toString(); }
                        if (node.cr === true) { msg.payload += "\n"; }
                    }
                    if (RED.settings.verbose) { node.log("inp: "+msg.payload); }
                    if (node.child !== null && node.running) { node.child.stdin.write(msg.payload); }
                    else { node.warn("Command not running"); }
                    lastmsg = msg;
                }
            }
        }

        function runit() {
            var line = "";
            if (!node.cmd || (typeof node.cmd !== "string") || (node.cmd.length < 1)) {
                node.status({fill:"grey",shape:"ring",text:"no command"});
                return;
            }
            try {
                node.child = spawn(node.cmd, node.args);
                if (RED.settings.verbose) { node.log(node.cmd+" "+JSON.stringify(node.args)); }
                node.status({fill:"green",shape:"dot",text:"running"});
                node.running = true;

                node.child.stdout.on('data', function (data) {
                    if (node.op === "string") { data = data.toString(); }
                    if (node.op === "number") { data = Number(data); }
                    if (RED.settings.verbose) { node.log("out: "+data); }
                    if (node.op === "lines") {
                        line += data.toString();
                        var bits = line.split("\n");
                        while (bits.length > 1) {
                            lastmsg.payload = bits.shift();
                            node.send([lastmsg,null,null]);
                        }
                        line = bits[0];
                    }
                    else {
                        if (data && (data.length !== 0)) {
                            lastmsg.payload = data;
                            node.send([lastmsg,null,null]);
                        }
                    }
                });

                node.child.stderr.on('data', function (data) {
                    if (node.op === "string") { data = data.toString(); }
                    if (node.op === "number") { data = Number(data); }
                    if (RED.settings.verbose) { node.log("err: "+data); }
                    lastmsg.payload = data;
                    node.send([null,lastmsg,null]);
                });

                node.child.on('close', function (code,signal) {
                    if (RED.settings.verbose) { node.log("ret: "+code+":"+signal); }
                    node.running = false;
                    node.child = null;
                    var rc = code;
                    if (code === null) { rc = signal; }
                    node.send([null,null,{payload:rc}]);
                    node.status({fill:"red",shape:"ring",text:"stopped"});
                });

                node.child.on('error', function (err) {
                    if (err.errno === "ENOENT") { node.warn('Command not found'); }
                    else if (err.errno === "EACCES") { node.warn('Command not executable'); }
                    else { node.log('error: ' + err); }
                    node.status({fill:"red",shape:"ring",text:"error"});
                });
            }
            catch(e) {
                if (e.errno === "ENOENT") { node.warn('Command not found'); }
                else if (e.errno === "EACCES") { node.warn('Command not executable'); }
                else { node.error(e); }
                node.status({fill:"red",shape:"ring",text:"error"});
                node.running = false;
            }
        }

        if (node.redo === true) {
            var loop = setInterval( function() {
                if (!node.running) {
                    node.warn("Restarting : " + node.cmd);
                    runit();
                }
            }, 10000);  // Restart after 10 secs if required
        }

        node.on("close", function(done) {
            clearInterval(loop);
            if (node.child != null) {
                var tout;
                node.child.on('exit', function() {
                    if (tout) { clearTimeout(tout); }
                    done();
                });
                tout = setTimeout(function() {
                    node.child.kill("SIGKILL"); // if it takes more than 3 secs kill it anyway.
                    done();
                }, 3000);
                node.child.kill(node.closer);
                if (RED.settings.verbose) { node.log(node.cmd+" stopped"); }
            }
            else { setTimeout(function() { done(); }, 100); }
            node.status({});
        });

        if (this.autorun) { runit(); }

        node.on("input", inputlistener);
    }
    RED.nodes.registerType("daemon",DaemonNode);
}
