
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
            if (plat == "linux" || plat == "android") { ex = spawn('ping', ['-n', '-w', '5', '-c', '1', node.host]); }
            else if (plat.match(/^win/)) { ex = spawn('ping', ['-n', '1', '-w', '5000', node.host]); }
            else if (plat == "darwin" || plat == "freebsd") { ex = spawn('ping', ['-n', '-t', '5', '-c', '1', node.host]); }
            else { node.error("Sorry - your platform - "+plat+" - is not recognised."); }
            var res = false;
            var line = "";
            //var regex = /from.*time.(.*)ms/;
            var regex = /=.*[<|=]([0-9]*).*TTL|ttl..*=([0-9\.]*)/;
            ex.stdout.on('data', function (data) {
                line += data.toString();
            });
            //ex.stderr.on('data', function (data) {
            //console.log('[ping] stderr: ' + data);
            //});
            ex.on('close', function (code) {
                var m = regex.exec(line)||"";
                if (m !== '') {
                    if (m[1]) { res = Number(m[1]); }
                    if (m[2]) { res = Number(m[2]); }
                }
                var msg = { payload:false, topic:node.host };
                if (code === 0) { msg = { payload:res, topic:node.host }; }
                try { node.send(msg); }
                catch(e) {}
            });
        }, node.timer);

        this.on("close", function() {
            if (this.tout) { clearInterval(this.tout); }
        });
    }
    RED.nodes.registerType("ping",PingNode);
}
