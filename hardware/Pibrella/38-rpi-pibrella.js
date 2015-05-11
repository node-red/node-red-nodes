/**
 * Copyright 2014 IBM Corp.
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
    var spawn = require('child_process').spawn;
    var fs = require('fs');

    var gpioCommand = __dirname+'/nrgpio';

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        //util.log("Info : Ignoring Raspberry Pibrella specific node.");
        throw "Info : Ignoring Raspberry Pibrella specific node.";
    }

    if (!fs.existsSync("/usr/share/doc/python-rpi.gpio")) {
        util.log("[rpi-pibrella] Info : Can't find RPi.GPIO python library.");
        throw "Warning : Can't find RPi.GPIO python library.";
    }

    if ( !(1 & parseInt ((fs.statSync(gpioCommand).mode & parseInt ("777", 8)).toString (8)[0]) )) {
        util.log("[rpi-pibrella] Error : "+gpioCommand+" needs to be executable.");
        throw "Error : nrgpio must to be executable.";
    }

    var pinsInUse = {};
    var pinTypes = {"out":"digital output", "tri":"input", "up":"input with pull up", "down":"input with pull down", "pwm":"PWM output"};

    var pintable = {
        // Name : Pin
        "Amber LED":"11",
        "Buzzer ":"12",
        "Red LED":"13",
        "Out E":"15",
        "Out F":"16",
        "Out G":"18",
        "Out H":"22",
        "Green LED":"7",
        "In D":"19",
        "In A":"21",
        "In B":"26",
        "In C":"24",
        "Red Button":"23"
    }
    var tablepin = {
        // Pin : Name
        "11":"Amber",
        "12":"Buzzer",
        "13":"Red",
        "15":"E",
        "16":"F",
        "18":"G",
        "22":"H",
        "7":"Green",
        "19":"D",
        "21":"A",
        "26":"B",
        "24":"C",
        "23":"R"
    }

    function PibrellaIn(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = pintable[n.pin];
        this.read = n.read || false;
        if (this.read) { this.buttonState = -2; }
        var node = this;
        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = "tri";
        }
        else {
            if ((pinsInUse[this.pin] !== "tri")||(pinsInUse[this.pin] === "pwm")) {
                node.error("GPIO pin "+this.pin+" already set as "+pinTypes[pinsInUse[this.pin]]);
            }
        }

        if (node.pin !== undefined) {
            node.child = spawn(gpioCommand, ["in",node.pin]);
            node.running = true;
            node.status({fill:"green",shape:"dot",text:"OK"});

            node.child.stdout.on('data', function (data) {
                data = data.toString().trim();
                if (data.length > 0) {
                    if (node.buttonState !== -1) {
                        node.send({ topic:"pibrella/"+tablepin[node.pin], payload:Number(data) });
                    }
                    node.buttonState = data;
                    node.status({fill:"green",shape:"dot",text:data});
                    if (RED.settings.verbose) { node.log("out: "+data+" :"); }
                }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                if (RED.settings.verbose) { node.log("ret: "+code+" :"); }
                node.child = null;
                node.running = false;
                node.status({fill:"red",shape:"circle",text:""});
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.warn('Command not found'); }
                else if (err.errno === "EACCES") { node.warn('Command not executable'); }
                else { node.log('error: ' + err); }
            });

        }
        else {
            node.error("Invalid GPIO pin: "+node.pin);
        }

        node.on("close", function() {
            if (node.child != null) {
                node.child.stdin.write(" close "+node.pin);
                node.child.kill('SIGKILL');
            }
            node.status({fill:"red",shape:"circle",text:""});
            delete pinsInUse[node.pin];
            if (RED.settings.verbose) { node.log("end"); }
        });
    }
    RED.nodes.registerType("rpi-pibrella in",PibrellaIn);


    function PibrellaOut(n) {
        RED.nodes.createNode(this,n);
        this.pin = pintable[n.pin];
        this.set = n.set || false;
        this.level = n.level || 0;
        this.out = n.out || "out";
        var node = this;
        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.out;
        }
        else {
            if ((pinsInUse[this.pin] !== this.out)||(pinsInUse[this.pin] === "pwm")) {
                node.error("GPIO pin "+this.pin+" already set as "+pinTypes[pinsInUse[this.pin]]);
            }
        }

        function inputlistener(msg) {
            if (msg.payload === "true") { msg.payload = true; }
            if (msg.payload === "false") { msg.payload = false; }
            var out = Number(msg.payload);
            var limit = 1;
            if (node.out === "pwm") { limit = 100; }
            if (node.pin === "12") {
                limit = 4096;
                if (out === 1) { out = 262; }
            }
            if ((out >= 0) && (out <= limit)) {
                if (RED.settings.verbose) { node.log("inp: "+msg.payload); }
                if (node.child !== null) { node.child.stdin.write(out+"\n"); }
                else { node.warn("Command not running"); }
                node.status({fill:"green",shape:"dot",text:msg.payload});
            }
            else { node.warn("Invalid input: "+out); }
        }

        if (node.pin !== undefined) {
            if (node.pin === "12") {
                node.child = spawn(gpioCommand, ["buzz",node.pin]);
            } else {
                if (node.set && (node.out === "out")) {
                    node.child = spawn(gpioCommand, [node.out,node.pin,node.level]);
                } else {
                    node.child = spawn(gpioCommand, [node.out,node.pin]);
                }
            }
            node.running = true;
            node.status({fill:"green",shape:"dot",text:"OK"});

            node.on("input", inputlistener);

            node.child.stdout.on('data', function (data) {
                if (RED.settings.verbose) { node.log("out: "+data+" :"); }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                if (RED.settings.verbose) { node.log("ret: "+code+" :"); }
                node.child = null;
                node.running = false;
                node.status({fill:"red",shape:"circle",text:""});
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.warn('Command not found'); }
                else if (err.errno === "EACCES") { node.warn('Command not executable'); }
                else { node.log('error: ' + err); }
            });

        }
        else {
            node.error("Invalid GPIO pin: "+node.pin);
        }

        node.on("close", function() {
            if (node.child != null) {
                node.child.stdin.write(" close "+node.pin);
                node.child.kill('SIGKILL');
            }
            node.status({fill:"red",shape:"circle",text:""});
            delete pinsInUse[node.pin];
            if (RED.settings.verbose) { node.log("end"); }
        });

    }
    RED.nodes.registerType("rpi-pibrella out",PibrellaOut);

    RED.httpAdmin.get('/rpi-pibpins/:id',RED.auth.needsPermission('rpi-pibrella.read'),function(req,res) {
        res.json(pinsInUse);
    });
}
