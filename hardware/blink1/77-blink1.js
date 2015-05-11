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
    var Blink1 = require("node-blink1");
    // create a single global blink1 object
    // all blink1 nodes affect the same (single) led
    var blink1 = null;

    function Blink1Node(n) {
        RED.nodes.createNode(this,n);
        this.fade = Number(n.fade) || 0;
        var node = this;

        try {
            var p1 = /^\#[A-Fa-f0-9]{6}$/
            var p2 = /[0-9]+,[0-9]+,[0-9]+/
            this.on("input", function(msg) {
                try {
                    blink1 = blink1 || new Blink1.Blink1();
                    if (blink1) {
                        var r,g,b;
                        try {
                            if (p1.test(msg.payload)) {
                                // if it is a hex colour string
                                r = parseInt(msg.payload.slice(1,3),16);
                                g = parseInt(msg.payload.slice(3,5),16);
                                b = parseInt(msg.payload.slice(5),16);
                                if (node.fade === 0) { blink1.setRGB( r, g, b ); }
                                else { blink1.fadeToRGB(node.fade, r, g, b ); }
                            }
                            else if (p2.test(msg.payload)) {
                                // if it is a r,g,b triple
                                var rgb = msg.payload.split(',');
                                if (node.fade === 0) { blink1.setRGB(parseInt(rgb[0])&255, parseInt(rgb[1])&255, parseInt(rgb[2])&255); }
                                else { blink1.fadeToRGB(node.fade, parseInt(rgb[0])&255, parseInt(rgb[1])&255, parseInt(rgb[2])&255); }
                            }
                            else {
                                // you can add fancy colours by name here if you want...
                                // these are the @cheerlight ones.
                                var colors = {"red":"#FF0000","green":"#00FF00","blue":"#0000FF","cyan":"#00FFFF",
                                    "white":"#FFFFFF","warmwhite":"#FDF5E6","oldlace":"#FDF5E6","purple":"#800080","magenta":"#FF00FF",
                                    "yellow":"#FFFF00","amber":"#FFD200","orange":"#FFA500","black":"#000000","pink":"#FF69B4"}
                                if (msg.payload.toLowerCase() in colors) {
                                    var c = colors[msg.payload.toLowerCase()];
                                    r = parseInt(c.slice(1,3),16);
                                    g = parseInt(c.slice(3,5),16);
                                    b = parseInt(c.slice(5),16);
                                    if (node.fade === 0) { blink1.setRGB( r, g, b ); }
                                    else { blink1.fadeToRGB(node.fade, r, g, b ); }
                                }
                                else {
                                    node.warn("Blink1 : invalid msg : "+msg.payload);
                                }
                            }
                        } catch (e) { node.error("Blink1 : error"); blink1 = null; }
                    }
                    else {
                        node.warn("Blink1 : not found");
                    }
                } catch (e) { node.error("Blink1 : device not found"); blink1 = null; }
            });
            this.on("close", function() {
                if (blink1 && typeof blink1.close == "function") {
                    //blink1.close(); //This ought to work but seems to cause more hangs on closing than not...
                }
                blink1 = null;
            });
        }
        catch(e) {
            node.error("No Blink1 found (" + e + ")");
        }
    }
    RED.nodes.registerType("blink1",Blink1Node);
}
