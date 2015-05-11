/**
 * Copyright 2013,2015 IBM Corp.
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
    var util = require("util");
    //var exec = require('child_process').exec;
    var spawn = require('child_process').spawn;
    var fs = require('fs');

    var gpioCommand = __dirname+'/nrgpio';

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        //util.log("Info : Ignoring Raspberry LEDborg specific node.");
        throw "Info : Ignoring Raspberry LEDborg specific node.";
    }

    if (!fs.existsSync("/usr/share/doc/python-rpi.gpio")) {
        util.log("[rpi-ledborg] Info : Can't find RPi.GPIO python library.");
        throw "Warning : Can't find RPi.GPIO python library.";
    }

    if ( !(1 & parseInt ((fs.statSync(gpioCommand).mode & parseInt ("777", 8)).toString (8)[0]) )) {
        util.log("[rpi-ledborg] Error : "+gpioCommand+" needs to be executable.");
        throw "Error : nrgpio must to be executable.";
    }

    // GPIO pins 11 (R), 13 (G), 15 (B).

    function LedBorgNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        this.set = n.set || false;
        this.level = n.level || 0;
        this.out = n.out || "out";
        var node = this;
        var p1 = /^[0-2][0-2][0-2]$/
        var p2 = /^\#[A-Fa-f0-9]{6}$/
        var p3 = /^\d+,\d+,\d+$/

        function inputlistener(msg) {
            var rgb = "000";

            if (p1.test(msg.payload)) {
                rgb = msg.payload;
                rgb = Number(rgb[0])*50+","+Number(rgb[1])*50+","+Number(rgb[2])*50;
            }
            else if (p2.test(msg.payload)) {
                var r = Math.floor(parseInt(msg.payload.slice(1,3),16)*100/256).toString();
                var g = Math.floor(parseInt(msg.payload.slice(3,5),16)*100/256).toString();
                var b = Math.floor(parseInt(msg.payload.slice(5),16)*100/256).toString();
                rgb = r+","+g+","+b;
            }
            else if (p3.test(msg.payload)) {
                var c = msg.payload.split(",");
                var r1 = Math.floor(parseInt(c[0])*100/256).toString();
                var g1 = Math.floor(parseInt(c[1])*100/256).toString();
                var b1 = Math.floor(parseInt(c[2])*100/256).toString();
                rgb = r1+","+g1+","+b1;
            }
            else {
                // you can add fancy colours by name here if you want...
                // these are the @cheerlight ones.
                var colors = {"red":"200","green":"020","blue":"002","cyan":"022","white":"222","pink":"201","oldlace":"221",
                    "warmwhite":"221","purple":"101","magenta":"202","yellow":"220","amber":"220","orange":"210","black":"000"}
                if (msg.payload.toLowerCase() in colors) {
                    rgb = colors[msg.payload.toLowerCase()];
                    rgb = Number(rgb[0])*50+","+Number(rgb[1])*50+","+Number(rgb[2])*50;
                }
                else {
                    node.warn("Invalid LedBorg colour code");
                }
            }

            if (RED.settings.verbose) { node.log("out: "+msg.payload); }
            if (node.child !== null) { node.child.stdin.write(rgb+"\n"); }
            else { node.warn("Command not running"); }
            node.status({fill:"green",shape:"dot",text:msg.payload});
        }

        node.child = spawn(gpioCommand, ["borg","11"]);
        node.running = true;
        node.status({fill:"green",shape:"dot",text:"OK"});

        node.on("input", inputlistener);

        node.child.stdout.on('data', function (data) {
            if (RED.settings.verbose) { node.log("out: "+data+" :"); }
        });

        node.child.stderr.on('data', function (data) {
            if (RED.settings.verbose) { node.log("err: "+data+" :"); }
        });

        node.child.on('close', function () {
            node.child = null;
            node.running = false;
            node.status({fill:"red",shape:"circle",text:""});
            if (RED.settings.verbose) { node.log("closed"); }
            if (node.done) { node.done(); }
        });

        node.child.on('error', function (err) {
            if (err.errno === "ENOENT") { node.warn('Command not found'); }
            else if (err.errno === "EACCES") { node.warn('Command not executable'); }
            else { node.log('error: ' + err); }
        });

        node.on("close", function(done) {
            node.status({fill:"red",shape:"circle",text:""});
            if (node.child != null) {
                node.done = done;
                node.child.stdin.write(" close 11");
                node.child.kill('SIGKILL');
            }
            else { done(); }

        });

    }
    RED.nodes.registerType("ledborg",LedBorgNode);
}
