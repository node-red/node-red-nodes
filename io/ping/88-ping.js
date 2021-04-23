
module.exports = function(RED) {
    "use strict";
    var spawn = require("child_process").spawn;
    var plat = require("os").platform();

    function doPing(node, host, arrayMode) {
        const defTimeout = 5000;
        var ex, ex6, hostOptions, commandLineOptions;
        if (typeof host === "string") {
            hostOptions = {
                host: host,
                timeout: defTimeout
            }
        } else {
            hostOptions = host;
            hostOptions.timeout = isNaN(parseInt(hostOptions.timeout)) ? defTimeout : parseInt(hostOptions.timeout);
        }
        //clamp timeout between 1 and 30 sec
        hostOptions.timeout = hostOptions.timeout < 1000 ? 1000 : hostOptions.timeout;
        hostOptions.timeout = hostOptions.timeout > 30000 ? 30000 : hostOptions.timeout;
        var timeoutS = Math.round(hostOptions.timeout / 1000); //whole numbers only
        var msg = { payload:false, topic:hostOptions.host };
        //only include the extra msg object if operating in advance/array mode.
        if (arrayMode) {
            msg.ping = hostOptions
        }

        var cmd = "ping";
        //User Selected Protocol
        if (plat == "linux" || plat == "android") {
            if (node.protocol === "IPv4") {
                commandLineOptions = ["-n", "-4", "-w", timeoutS, "-c", "1"]; //IPv4
            } else if (node.protocol === "IPv6") {
                commandLineOptions = ["-n", "-6", "-w", timeoutS, "-c", "1"]; //IPv6
            } else {
                commandLineOptions = ["-n", "-w", timeoutS, "-c", "1"]; //Automatic
            }
        } else if (plat.match(/^win/)) {
            if (node.protocol === "IPv4") {
                commandLineOptions = ["-n", "1", "-4", "-w", hostOptions.timeout]; //IPv4
            } else if (node.protocol === "IPv6") {
                commandLineOptions = ["-n", "1", "-6", "-w", hostOptions.timeout]; //IPv6
            } else {
                commandLineOptions = ["-n", "1", "-w", hostOptions.timeout]; //Automatic
            }
        } else if (plat == "darwin" || plat == "freebsd") {
            if (node.protocol === "IPv4") {
                commandLineOptions = ["-n", "-t", timeoutS, "-c", "1"]; //IPv4
            } else if (node.protocol === "IPv6") {
                cmd = "ping6";
                commandLineOptions = ["-n", "-t", timeoutS, "-c", "1"]; //IPv6
            } else {
                commandLineOptions = ["-n", "-t", timeoutS, "-c", "1"]; //Automatic
            }

        } else {
            node.error("Sorry - your platform - "+plat+" - is not recognised.", msg);
            return; //dont pass go - just return!
        }

        //spawn with timeout in case of os issue
        ex = spawn(cmd, [...commandLineOptions, hostOptions.host]);

        //monitor every spawned process & SIGINT if too long
        var spawnTout = setTimeout(() => {
            node.log(`ping - Host '${hostOptions.host}' process timeout - sending SIGINT`)
            try {
                if (ex && ex.pid) { ex.kill("SIGINT"); }
            }
            catch(e) {console.warn(e); }
        }, hostOptions.timeout+1000); //add 1s for grace

        var res = false;
        var line = "";
        var fail = false;
        //var regex = /from.*time.(.*)ms/;
        var regex = /=.*[<|=]([0-9]*).*TTL|ttl..*=([0-9\.]*)/;

        var tryPing6 = false;
        //catch error msg from ping
        ex.stderr.setEncoding('utf8');
        ex.stderr.on("data", function (data) {
            if (!data.includes('Usage')) { // !data: only get the error and not how to use the ping command
                if (data.includes('invalid') && data.includes('6')) { //if IPv6 not supported in version of ping try ping6
                    tryPing6 = true;
                }
                else if (data.includes('Network is unreachable')) {
                    node.status({shape:"ring",fill:"red"});
                    node.error(data + "  Please check that your service provider or network device has IPv6 enabled", msg);
                    node.hadErr = true;
                }
                else {
                    node.status({shape:"ring",fill:"grey"});
                    node.hadErr = true;
                }
            }
        });

        ex.stdout.on("data", function (data) {
            line += data.toString();
        });
        ex.on("exit", function (err) {
            clearTimeout(spawnTout);
        });
        ex.on("error", function (err) {
            fail = true;
            if (err.code === "ENOENT") {
                node.error(err.code + " ping command not found", msg);
            }
            else if (err.code === "EACCES") {
                node.error(err.code + " can't run ping command", msg);
            }
            else {
                node.error(err.code, msg);
            }
        });
        ex.on("close", function (code) {
            if (tryPing6 === false) {
                if (fail) { fail = false; return; }
                var m = regex.exec(line)||"";
                if (m !== "") {
                    if (m[1]) { res = Number(m[1]); }
                    if (m[2]) { res = Number(m[2]); }
                }
                if (code === 0) { msg.payload = res }
                try { node.send(msg); }
                catch(e) {console.warn(e)}

            }
            else {
                //fallback to ping6 for OS's that have not updated/out of date
                if (plat == "linux" || plat == "android") {
                    commandLineOptions = ["-n", "-w", timeoutS, "-c", "1"];
                } else if (plat == "darwin" || plat == "freebsd") {
                    commandLineOptions = ["-n", "-c", "1"] //NOTE: -X / timeout does not work on mac OSX and most freebsd systems
                } else {
                    node.error("Sorry IPv6 on your platform - "+plat+" - is not supported.", msg);
                }
                //spawn with timeout in case of os issue
                ex6 = spawn("ping6", [...commandLineOptions, hostOptions.host]);

                //monitor every spawned process & SIGINT if too long
                var spawnTout = setTimeout(() => {
                    node.log(`ping6 - Host '${hostOptions.host}' process timeout - sending SIGINT`)
                    try {
                        if (ex6 && ex6.pid) { ex6.kill("SIGINT"); }
                    }
                    catch(e) {console.warn(e); }
                }, hostOptions.timeout+1000); //add 1s for grace

                //catch error msg from ping6
                ex6.stderr.setEncoding('utf8');
                ex6.stderr.on("data", function (data) {
                    if (!data.includes('Usage')) { // !data: only get the error and not how to use the ping6 command
                        if (data.includes('Network is unreachable')) {
                            node.error(data + "  Please check that your service provider or network device has IPv6 enabled", msg);
                            node.status({shape:"ring",fill:"red"});
                        }
                        else {
                            node.status({shape:"ring",fill:"grey"});
                        }
                        node.hadErr = true;
                    }
                });

                ex6.stdout.on("data", function (data) {
                    line += data.toString();
                });
                ex6.on("exit", function (err) {
                    clearTimeout(spawnTout);
                });
                ex6.on("error", function (err) {
                    fail = true;
                    if (err.code === "ENOENT") {
                        node.error(err.code + " ping6 command not found", msg);
                    }
                    else if (err.code === "EACCES") {
                        node.error(err.code + " can't run ping6 command", msg);
                    }
                    else {
                        node.error(err.code, msg);
                    }
                });
                ex6.on("close", function (code) {
                    if (fail) { fail = false; return; }
                    var m = regex.exec(line)||"";
                    if (m !== "") {
                        if (m[1]) { res = Number(m[1]); }
                        if (m[2]) { res = Number(m[2]); }
                    }
                    if (code === 0) { msg.payload = res }
                    try { node.send(msg); }
                    catch(e) {console.warn(e)}
                });
            }
        });
    }

    function PingNode(n) {
        RED.nodes.createNode(this,n);
        this.protocol = n.protocol||'Automatic';
        this.mode = n.mode;
        this.host = n.host;
        this.timer = n.timer * 1000;
        this.hadErr = false;
        var node = this;

        function generatePingList(str) {
            return (str + "").split(",").map((e) => (e + "").trim()).filter((e) => e != "");
        }
        function clearPingInterval() {
            if (node.tout) { clearInterval(node.tout); }
        }

        if (node.mode === "triggered") {
            clearPingInterval();
        } else if (node.timer) {
            node.tout = setInterval(function() {
                if (node.hadErr) { node.hadErr = false; node.status({}); }
                let pingables = generatePingList(node.host);
                for (let index = 0; index < pingables.length; index++) {
                    const element = pingables[index];
                    if (element) { doPing(node, element, false); }
                }
            }, node.timer);
        }

        this.on("input", function (msg) {
            let node = this;
            if (node.hadErr) { node.hadErr = false; node.status({}); }
            let payload = node.host || msg.payload;
            if (typeof payload == "string") {
                let pingables = generatePingList(payload)
                for (let index = 0; index < pingables.length; index++) {
                    const element = pingables[index];
                    if (element) { doPing(node, element, false); }
                }
            } else if (Array.isArray(payload) ) {
                for (let index = 0; index < payload.length; index++) {
                    const element = payload[index];
                    if (element) { doPing(node, element, true); }
                }
            }
        });

        this.on("close", function() {
            clearPingInterval();
        });
    }
    RED.nodes.registerType("ping",PingNode);
}
