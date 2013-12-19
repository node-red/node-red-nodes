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

var RED = require(process.env.NODE_RED_HOME+"/red/red");
var Blink1 = require("node-blink1");

function Blink1Node(n) {
    RED.nodes.createNode(this,n);
    this.fade = Number(n.fade) || 0;
    var node = this;

    try {
        var p1 = /^\#[A-Fa-f0-9]{6}$/
        var p2 = /[0-9]+,[0-9]+,[0-9]+/
        this.on("input", function(msg) {
            if (blink1) {
                if (p1.test(msg.payload)) {
                    // if it is a hex colour string
                    var r = parseInt(msg.payload.slice(1,3),16);
                    var g = parseInt(msg.payload.slice(3,5),16);
                    var b = parseInt(msg.payload.slice(5),16);
                    if (node.fade == 0) { blink1.setRGB( r, g, b ); }
                    else { blink1.fadeToRGB(node.fade, r, g, b ); }
                }
                else if (p2.test(msg.payload)) {
                    // if it is a r,g,b triple
                    var rgb = msg.payload.split(',');
                    if (node.fade == 0) { blink1.setRGB(parseInt(rgb[0])&255, parseInt(rgb[1])&255, parseInt(rgb[2])&255); }
                    else { blink1.fadeToRGB(node.fade, parseInt(rgb[0])&255, parseInt(rgb[1])&255, parseInt(rgb[2])&255); }
                }
                else {
                    // you can add fancy colours by name here if you want...
                    // these are the @cheerlight ones.
                    var result = msg.payload.toLowerCase().match(/red|green|blue|cyan|white|warmwhite|purple|magenta|yellow|orange|black/g);
                    var colors = {"red":"#FF0000","green":"#008000","blue":"#0000FF","cyan":"#00FFFF","white":"#FFFFFF",
                        "warmwhite":"#FDF5E6","purple":"#800080","magenta":"#FF00FF","yellow":"#FFFF00","orange":"#FFA500","black":"#000000"}
                    if (result != null) {
                        for (var colour in result) {
                            var c = colors[result[colour]];
                            var r = parseInt(c.slice(1,3),16);
                            var g = parseInt(c.slice(3,5),16);
                            var b = parseInt(c.slice(5),16);
                            if (node.fade == 0) { blink1.setRGB( r, g, b ); }
                            else { blink1.fadeToRGB(node.fade, r, g, b ); }
                        }
                    }
                    else {
                        node.warn("Blink1 : invalid msg : "+msg.payload);
                    }
                }
            }
            else {
                node.warn("No Blink1 found");
            }
        });
        this.on("close", function() {
            if (blink1 && typeof blink1.close == "function") {
                blink1.close();
            }
        });
        var blink1 = new Blink1.Blink1();
    }
    catch(e) {
        node.error("No Blink1 found (" + e + ")");
    }
}
RED.nodes.registerType("blink1",Blink1Node);
