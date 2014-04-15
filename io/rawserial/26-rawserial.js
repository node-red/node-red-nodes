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
    this.split = n.split||null;
    if (this.split == '\\n') this.split = "\n";
    if (this.split == '\\r') this.split = "\r";
    var node = this;

    var setupSerial = function() {
        node.inp = fs.createReadStream(pre+node.port);
        node.log("opened "+pre+node.port);
        node.inp.setEncoding('utf8');
        var line = "";
        node.inp.on('data', function (data) {
            if (node.split != null) {
                if (data == node.split) {
                    node.send({payload:line});
                    line = "";
                }
                else { line += data; }
            }
            else { node.send({payload:data}); }
        });
        //node.inp.on('end', function (error) {console.log("End", error);});
        node.inp.on('close', function (error) {
            util.log("[rawserial] "+node.port+" closed");
            node.tout = setTimeout(function() {
                setupSerial();
            },settings.serialReconnectTime);
        });
        node.inp.on('error', function(error) {
            if (error.code == "ENOENT") { util.log("[rawserial] port "+node.port+" not found"); }
            else { util.log("[rawserial] "+node.port+" error "+error); }
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
        node.oup = fs.createWriteStream(pre+node.port,{ flags:'w', encoding:'utf8', mode:0666 });
        node.on("input", function(msg) {
            if (msg.payload != null) {
                node.oup.write(msg.payload);
            }
        });
        node.oup.on('open', function (error) { util.log("[rawserial] opened "+node.port); });
        node.oup.on('end', function (error) { console.log("End",error); });
        node.oup.on('close', function (error) {
            util.log("[rawserial] "+node.port+" closed");
            node.tout = setTimeout(function() {
                setupSerial();
            },settings.serialReconnectTime);
        });
        node.oup.on('error', function(error) {
            if (error.code == "EACCES") { util.log("[rawserial] can't access port "+node.port); }
            else if (error.code == "EIO") { util.log("[rawserial] can't write to port "+node.port); }
            else { util.log("[rawserial] "+node.port+" error "+error); }
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
