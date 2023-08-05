
module.exports = function(RED) {
    "use strict";
    var spawn = require('child_process').spawn;

    function DaemonNode(n) {
        RED.nodes.createNode(this,n);
        this.cmd = n.command;
        //this.args = n.args.trim().split(" ") || [];
        this.args = n.args.trim(); //.match(/("[^"]*")|[^ ]+/g);
        this.cr = n.cr;
        this.op = n.op;
        this.redo = n.redo;
        this.running = false;
        this.stopped = false;
        this.closer = n.closer || "SIGKILL";
        this.autorun = true;
        if (n.autorun === false) { this.autorun = false; }
        this.args = parseArgs(this.args);
        var node = this;
        var lastmsg = {};

        function parseArgs(args) {
            if (args.match(/^\[.*\]$/)) {
                try { args = JSON.parse(args); }
                catch(e) {
                    node.warn(RED._("daemon.errors.badparams"))
                }
            }
            else { args = args.match(/("[^"]*")|[^ ]+/g); }
            return args;
        }

        function inputlistener(msg) {
            if (msg != null) {
                if (msg.hasOwnProperty("stop")) {
                    node.stopped = true;
                    if (node.running) {
                        node.child.kill(node.closer);
                    }
                    node.status({fill:"grey",shape:"ring",text:RED._("daemon.status.stopped")});
                }
                else if (msg.hasOwnProperty("kill") && node.running) {
                    if (typeof msg.kill !== "string" || msg.kill.length === 0 || !msg.kill.toUpperCase().startsWith("SIG") ) { msg.kill = "SIGINT"; }
                    node.child.kill(msg.kill.toUpperCase());
                }
                else if (msg.hasOwnProperty("start")) {
                    if (!node.running) {
                        let args = "";
                        if (msg.hasOwnProperty("args") && msg.args.length > 0) {
                            args = parseArgs(msg.args.trim());
                        }
                        runit(args);
                    }
                    node.stopped = false;
                }
                else {
                    if (!Buffer.isBuffer(msg.payload)) {
                        if (typeof msg.payload === "object") { msg.payload = JSON.stringify(msg.payload); }
                        if (typeof msg.payload !== "string") { msg.payload = msg.payload.toString(); }
                        if (node.cr === true) { msg.payload += "\n"; }
                    }
                    node.debug("inp: "+msg.payload);
                    lastmsg = msg;
                    if (node.child !== null && node.running) { node.child.stdin.write(msg.payload); }
                    else { node.warn(RED._("daemon.errors.notrunning")); }
                }
            }
        }

        function runit(appendArgs) {
            var line = "";
            if (!node.cmd || (typeof node.cmd !== "string") || (node.cmd.length < 1)) {
                node.status({fill:"grey",shape:"ring",text:RED._("daemon.status.nocommand")});
                return;
            }
            let args = node.args;
            if (appendArgs !== undefined && appendArgs.length > 0) {
                args = args.concat(appendArgs);
            }

            try {
                node.child = spawn(node.cmd, args);
                node.debug(node.cmd+" "+JSON.stringify(args));
                node.status({fill:"green",shape:"dot",text:RED._("daemon.status.running")});
                node.running = true;

                node.child.stdout.on('data', function (data) {
                    if (node.op === "string") { data = data.toString(); }
                    if (node.op === "number") { data = Number(data); }
                    node.debug("out: "+data);
                    if (node.op === "lines") {
                        line += data.toString();
                        var bits = line.split("\n");
                        while (bits.length > 1) {
                            var m = RED.util.cloneMessage(lastmsg);
                            m.payload = bits.shift();
                            node.send([m,null,null]);
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
                    node.debug("err: "+data);
                    lastmsg.payload = data;
                    node.send([null,lastmsg,null]);
                });

                node.child.on('close', function (code,signal) {
                    node.debug("ret: "+code+":"+signal);
                    node.running = false;
                    node.child = null;
                    var rc = code;
                    if (code === null) { rc = signal; }
                    node.send([null,null,{payload:rc}]);
                    const color = node.stopped ? "grey" : "red";
                    node.status({fill:color,shape:"ring",text:RED._("daemon.status.stopped")});
                });

                node.child.on('error', function (err) {
                    if (err.errno === "ENOENT") { node.warn(RED._("daemon.errors.notfound")); }
                    else if (err.errno === "EACCES") { node.warn(RED._("daemon.errors.notexecutable")); }
                    else { node.log('error: ' + err); }
                    node.status({fill:"red",shape:"ring",text:RED._("daemon.status.error")});
                });

                node.child.stdin.on('error', function (err) {
                    if (err.errno === "EPIPE") { node.error(RED._("daemon.errors.pipeclosed"),lastmsg); }
                    else { node.log('error: ' + err); }
                    node.status({fill:"red",shape:"ring",text:RED._("daemon.status.error")});
                });
            }
            catch(e) {
                if (e.errno === "ENOENT") { node.warn(RED._("daemon.errors.notfound")); }
                else if (e.errno === "EACCES") { node.warn(RED._("daemon.errors.notexecutable")); }
                else { node.error(e); }
                node.status({fill:"red",shape:"ring",text:RED._("daemon.status.error")});
                node.running = false;
            }
        }

        if (node.redo === true) {
            var loop = setInterval( function() {
                if (!node.running && !node.stopped) {
                    node.warn(RED._("daemon.errors.restarting") + " : " + node.cmd);
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
                node.debug(node.cmd+" stopped");
            }
            else { setTimeout(function() { done(); }, 100); }
            node.status({});
        });

        if (this.autorun) { runit(); }

        node.on("input", inputlistener);
    }
    RED.nodes.registerType("daemon",DaemonNode);
}
