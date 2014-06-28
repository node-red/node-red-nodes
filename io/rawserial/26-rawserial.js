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
    var settings = RED.settings;
    var util = require("util");
    var fs = require('fs');
    var plat = require('os').platform();
    var pre = "\\\\.\\";

    if (!plat.match(/^win/)) {
        util.log("[26-rawserial.js] Info : only really needed for Windows boxes without serialport npm module installed.");
        pre = "";
    }

    function RawSerialInNode(n) {
        RED.nodes.createNode(this,n);
        this.port = n.port;
        this.splitc = n.splitc||null;
        this.out = n.out||"char";
        this.bin = n.bin||false;
        if (this.splitc == '\\n') { this.splitc = "\n"; }
        if (this.splitc == '\\r') { this.splitc = "\r"; }
        if (!isNaN(parseInt(this.splitc))) { this.splitc = parseInt(this.splitc); }
        var node = this;

        var setupSerial = function() {
            node.inp = fs.createReadStream(pre+node.port);
            node.log("open "+pre+node.port);
            node.tout = null;
            var line = "";
            var buf = new Buffer(32768);
            var i = 0;
            node.inp.on('data', function (data) {
                for (var z = 0; z < data.length; z++) {
                    if ((node.out === "time") && (node.splitc !== 0)) {
                        if (node.tout) {
                            i += 1;
                            buf[i] = data[z];
                        }
                        else {
                            node.tout = setTimeout(function () {
                                node.tout = null;
                                var m = new Buffer(i+1);
                                buf.copy(m,0,0,i+1);
                                if (node.bin !== "true") { m = m.toString(); }
                                node.send({"payload": m});
                                m = null;
                            }, node.splitc);
                            i = 0;
                            buf[0] = data[z];
                        }
                    }
                    else if ((node.out == "char") && (node.splitc != null)) {
                        buf[i] = data[z];
                        i += 1;
                        if ((data[z] === node.splitc.charCodeAt(0)) || (i === 32768)) {
                            var m = new Buffer(i);
                            buf.copy(m,0,0,i);
                            if (node.bin !== "true") { m = m.toString(); }
                            node.send({"payload":m});
                            m = null;
                            i = 0;
                        }
                    }
                    else {
                        if (node.bin !== "true") { node.send({"payload": String.fromCharCode(data[z])}); }
                        else { node.send({"payload": new Buffer([data[z]])});}
                    }
                }
            });
            //node.inp.on('end', function (error) {console.log("End", error);});
            node.inp.on('close', function (error) {
                node.log(node.port+" closed");
                node.tout = setTimeout(function() {
                    setupSerial();
                },settings.serialReconnectTime);
            });
            node.inp.on('error', function(error) {
                if (error.code == "ENOENT") { node.log(node.port+" not found"); }
                else { node.log(node.port+" error "+error); }
                node.tout = setTimeout(function() {
                    setupSerial();
                },settings.serialReconnectTime);
            });
        }
        setupSerial();

        node.on('close', function() {
            if (node.tout) { clearTimeout(node.tout); }
            if (node.inp) { node.inp.pause(); }
        });

    }
    RED.nodes.registerType("rawserial in",RawSerialInNode);


    function RawSerialOutNode(n) {
        RED.nodes.createNode(this,n);
        this.port = n.port;
        var node = this;

        var setupSerial = function() {
            node.oup = fs.createWriteStream(pre+node.port,{ flags:'w', encoding:'utf8', mode:'0666' });
            node.on("input", function(msg) {
                if (msg.payload != null) {
                    node.oup.write(msg.payload);
                }
            });
            node.oup.on('open', function (error) { node.log("opened "+node.port); });
            node.oup.on('end', function (error) { node.log("end :"+error); });
            node.oup.on('close', function (error) {
                node.log(node.port+" closed");
                node.tout = setTimeout(function() {
                    setupSerial();
                },settings.serialReconnectTime);
            });
            node.oup.on('error', function(error) {
                if (error.code == "EACCES") { node.log("can't access port "+node.port); }
                else if (error.code == "EIO") { node.log("can't write to port "+node.port); }
                else { node.log(node.port+" error "+error); }
                node.tout = setTimeout(function() {
                    setupSerial();
                },settings.serialReconnectTime);
            });
        }
        setupSerial();

        node.on('close', function() {
            if (node.tout) { clearTimeout(node.tout); }
        });
    }
    RED.nodes.registerType("rawserial out",RawSerialOutNode);
}
