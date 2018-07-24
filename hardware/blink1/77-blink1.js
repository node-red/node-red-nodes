
module.exports = function(RED) {
    "use strict";
    var Blink1 = require("node-blink1");
    var blink1 = {};

    function Blink1Node(n) {
        RED.nodes.createNode(this,n);
        this.serial = n.serial;
        if (!this.serial) { delete this.serial; }
        this.fade = Number(n.fade) || 500;
        if (this.fade < 0) { this.fade = 0; }
        if (this.fade > 60000) { this.fade = 60000; }
        var node = this;

        try {
            var p1 = /^\#[A-Fa-f0-9]{6}$/
            var p2 = /^[0-9]+,[0-9]+,[0-9]+$/
            var p3 = /^[0-9]+,[0-9]+,[0-9]+,[0-2]$/
            this.on("input", function(msg) {
                try {
                    blink1[node.serial||"one"] = blink1[node.serial||"one"] || new Blink1.Blink1(node.serial);
                    node.status({text:node.serial});
                    if (blink1[node.serial||"one"]) {
                        var r,g,b;
                        try {
                            if (p1.test(msg.payload)) {
                                // if it is a hex colour string
                                r = parseInt(msg.payload.slice(1,3),16);
                                g = parseInt(msg.payload.slice(3,5),16);
                                b = parseInt(msg.payload.slice(5),16);
                                if (node.fade === 0) { blink1[node.serial||"one"].setRGB( r, g, b ); }
                                else { blink1[node.serial||"one"].fadeToRGB(node.fade, r, g, b ); }
                            }
                            else if (p2.test(msg.payload)) {
                                // if it is a r,g,b triple
                                var rgb = msg.payload.split(',');
                                if (node.fade === 0) { blink1[node.serial||"one"].setRGB(parseInt(rgb[0])&255, parseInt(rgb[1])&255, parseInt(rgb[2])&255); }
                                else { blink1[node.serial||"one"].fadeToRGB(node.fade, parseInt(rgb[0])&255, parseInt(rgb[1])&255, parseInt(rgb[2])&255); }
                            }
                            else if (p3.test(msg.payload)) {
                                // if it is a r,g,b,index quad for a two led device
                                var rgb2 = msg.payload.split(',');
                                blink1[node.serial||"one"].fadeToRGB(node.fade, parseInt(rgb2[0])&255, parseInt(rgb2[1])&255, parseInt(rgb2[2])&255, parseInt(rgb2[3])&3);
                            }
                            else {
                                // you can add fancy colours by name here if you want...
                                // these are the @cheerlight ones.
                                var colors = {"red":"#FF0000","green":"#00FF00","blue":"#0000FF","cyan":"#00FFFF",
                                    "white":"#FFFFFF","warmwhite":"#FDF5E6","oldlace":"#FDF5E6",
                                    "purple":"#800080","magenta":"#FF00FF","pink":"#FF69B4",
                                    "yellow":"#FFFF00","amber":"#FFD200","orange":"#FFA500",
                                    "black":"#000000","off":"#000000"}
                                if (typeof(msg.payload) === "string") {
                                    if (msg.payload.toLowerCase() in colors) {
                                        var c = colors[msg.payload.toLowerCase()];
                                        r = parseInt(c.slice(1,3),16);
                                        g = parseInt(c.slice(3,5),16);
                                        b = parseInt(c.slice(5),16);
                                        if (node.fade === 0) { blink1[node.serial||"one"].setRGB( r, g, b ); }
                                        else { blink1[node.serial||"one"].fadeToRGB(node.fade, r, g, b ); }
                                    }
                                    else { node.warn("Blink1 : invalid colour name : " + msg.payload); }
                                }
                                else { node.warn("Blink1 : invalid msg : "+msg.payload); }
                            }
                        }
                        catch (e) { node.error("Blink1 : error"); blink1[node.serial||"one"] = null; }
                    }
                    else { node.warn("Blink1 : not found"); }
                }
                catch (e) { node.error("Blink1 : device not found"); blink1[node.serial||"one"] = null; }
            });
            this.on("close", function(done) {
                if (blink1[node.serial||"one"] && typeof blink1[node.serial||"one"].close === "function") {
                    blink1[node.serial||"one"].close(function() { done() });
                }
                else { done(); }
                blink1[node.serial||"one"] = null;
            });
        }
        catch(e) {
            node.error("No Blink1 found (" + e + ")");
        }
    }
    RED.nodes.registerType("blink1",Blink1Node);

    RED.httpAdmin.get("/blink1list", RED.auth.needsPermission('blink1.read'), function(req,res) {
        res.json(Blink1.devices());
    });
}
