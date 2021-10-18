
module.exports = function(RED) {
    "use strict";
    var fs = require('fs');
    var allOK = false;
    var mcpadc;
    // unlikely if not on a Pi
    try {
        var cpuinfo = fs.readFileSync("/proc/cpuinfo").toString();
        if (cpuinfo.indexOf(": BCM") === -1) {
            RED.log.warn("Info : mcp3xxx : Not running on a Pi - Ignoring node");
        }
        else {
            mcpadc = require('mcp-spi-adc');
            allOK = true;
        }
    }
    catch(err) {
        RED.log.warn("Info : mcp3xxx : Not running on a Pi - Ignoring node");
    }

    var mcp3xxx = [];

    function PiMcpNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin || 0;
        this.interval = n.interval || 1000;
        this.dnum = parseInt(n.dnum || 0);
        this.bus = parseInt(n.bus || 0);
        this.dev = n.dev || "3008";
        var node = this;
        var cb = function (err) { if (err) { node.error("Error: "+err); } };
        var opt = { speedHz:20000, deviceNumber:node.dnum, busNumber:node.bus };
        var chans = parseInt(this.dev.substr(3));

        if (allOK === true) {
            try {
                fs.statSync("/dev/spidev"+node.bus+"."+node.dnum);
                if (mcp3xxx.length === 0) {
                    for (var i=0; i<chans; i++) {
                        if (node.dev === "3002") { mcp3xxx.push(mcpadc.openMcp3002(i, opt, cb)); }
                        if (node.dev === "3004") { mcp3xxx.push(mcpadc.openMcp3004(i, opt, cb)); }
                        if (node.dev === "3008") { mcp3xxx.push(mcpadc.openMcp3008(i, opt, cb)); }
                        if (node.dev === "3201") { mcp3xxx.push(mcpadc.openMcp3201(i, opt, cb)); }
                        if (node.dev === "3202") { mcp3xxx.push(mcpadc.openMcp3202(i, opt, cb)); }
                        if (node.dev === "3204") { mcp3xxx.push(mcpadc.openMcp3204(i, opt, cb)); }
                        if (node.dev === "3208") { mcp3xxx.push(mcpadc.openMcp3208(i, opt, cb)); }
                        if (node.dev === "3304") { mcp3xxx.push(mcpadc.openMcp3304(i, opt, cb)); }
                    }
                }
                node.on("input", function(msg) {
                    var pin = null;
                    if (node.pin === "M") {
                        var pay = parseInt(msg.payload.toString());
                        if ((pay >= 0) && (pay < chans)) { pin = pay; }
                        else { node.warn("Payload needs to select channel 0 to "+(chans-1)); }
                    }
                    else { pin = parseInt(node.pin); }
                    if (pin !== null) {
                        mcp3xxx[pin].read(function (err, reading) {
                            if (err) { node.warn("Read error: "+err); }
                            else { node.send({payload:reading.rawValue, topic:"adc/"+pin}); }
                        });
                    }
                });
            }
            catch(err) {
                node.error("Error : Can't find SPI device - is SPI enabled in raspi-config ?");
            }

            node.on("close", function(done) {
                if (mcp3xxx.length !== 0) {
                    var j=0;
                    for (var i=0; i<chans; i++) {
                        mcp3xxx[i].close(function() { j += 1; if (j === chans) {done()} });
                    }
                    mcp3xxx = [];
                }
                else { done(); }
            });
        }
        else {
            node.status({text:"node inactive."})
        }
    }

    RED.nodes.registerType("pimcp3008",PiMcpNode);
}
