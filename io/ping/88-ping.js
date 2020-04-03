
module.exports = function(RED) {
    "use strict";
    var spawn = require("child_process").spawn;
    var plat = require("os").platform();

    function doPing(node, host, arrayMode){
        const defTimeout = 5000;
        var ex, hostOptions, commandLineOptions;
        if(typeof host === "string"){
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
        if(arrayMode){
            msg.ping = hostOptions
        }
        if (plat == "linux" || plat == "android") { 
            commandLineOptions = ["-n", "-w", timeoutS, "-c", "1"]
        } else if (plat.match(/^win/)) { 
            commandLineOptions = ["-n", "1", "-w", hostOptions.timeout]
        } else if (plat == "darwin" || plat == "freebsd") { 
            commandLineOptions = ["-n", "-t", timeoutS, "-c", "1"]
        } else { 
            node.error("Sorry - your platform - "+plat+" - is not recognised.", msg); 
            return; //dont pass go - just return!
        }

        //spawn with timeout in case of os issue
        ex = spawn("ping", [...commandLineOptions, hostOptions.host]); 

        //monitor every spawned process & SIGINT if too long
        var spawnTout = setTimeout(() => {
            node.log(`ping - Host '${hostOptions.host}' process timeout - sending SIGINT`)
            try{if(ex && ex.pid){ ex.kill("SIGINT"); }} catch(e){console.warn(e)}
        }, hostOptions.timeout+1000); //add 1s for grace

        var res = false;
        var line = "";
        var fail = false;
        //var regex = /from.*time.(.*)ms/;
        var regex = /=.*[<|=]([0-9]*).*TTL|ttl..*=([0-9\.]*)/;
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

    function PingNode(n) {
        RED.nodes.createNode(this,n);
        this.mode = n.mode;
        this.host = n.host;
        this.timer = n.timer * 1000;
        var node = this;

        function generatePingList(str) {
            return (str + "").split(",").map((e) => (e + "").trim()).filter((e) => e != "");
        }
        function clearPingInterval(){
            if (node.tout) { clearInterval(node.tout); }
        }

        if(node.mode === "triggered"){
            clearPingInterval();
        } else if(node.timer){
            node.tout = setInterval(function() {
                let pingables = generatePingList(node.host);
                for (let index = 0; index < pingables.length; index++) {
                    const element = pingables[index];
                    if(element){ doPing(node, element, false); }
                }
            }, node.timer);
        }

        this.on("input", function (msg) {
            let node = this;
            let payload = node.host || msg.payload;
            if(typeof payload == "string"){
                let pingables = generatePingList(payload)
                for (let index = 0; index < pingables.length; index++) {
                    const element = pingables[index];
                    if(element){ doPing(node, element, false); }
                }
            } else if (Array.isArray(payload) ) {
                for (let index = 0; index < payload.length; index++) {
                    const element = payload[index];
                    if(element){ doPing(node, element, true); }
                }
            }
        });

        this.on("close", function() {
            clearPingInterval();
        });


    }
    RED.nodes.registerType("ping",PingNode);
}