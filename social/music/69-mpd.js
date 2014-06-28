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
    var util = require("util");
    var exec = require('child_process').exec;
    var komponist = require('komponist');
    var mpc = null;
    exec("which mpd",function(err,stdout,stderr) {
        if (stdout.indexOf('mpd') == -1) {
            throw 'Error: Cannot find "mpd" command. Please install MPD.';
        }
    });

    exec("netstat -an | grep LISTEN | grep 6600",function(err,stdout,stderr) {
        if (stdout.indexOf('6600') == -1) {
            throw '[69-mpd.js] Error: MPD daemon not listening on port 6600. Please start MPD.';
        }
        komponist.createConnection(6600, 'localhost', function(err, client) {
            if (err) { node.error("MPD: Failed to connect to MPD server"); }
            mpc = client;
        });
    });


    function MPDOut(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.mpc = mpc;

        if (mpc != null) {
            this.on("input", function(msg) {
                if (msg != null) {
                    try {
                        //node.mpc.command(msg.payload);
                        node.mpc.command(msg.payload, msg.param, function(err, results) {
                            if (err) { node.log("error: "+err); }
                            //else { console.log(results); }
                        });
                    } catch (err) { node.log("error: "+err); }
                }
            });

            node.mpc.on('error', function(err) {
                node.log("error: "+err);
            });
        }
        else { node.warn("MPD not running"); }
    }
    RED.nodes.registerType("mpd out",MPDOut);

    function MPDIn(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.mpc = mpc;
        var oldMsg = "";

        if (mpc != null) {
            getSong();

            var getSong = function() {
                node.mpc.currentsong(function(err, info) {
                    if (err) { node.log(err); }
                    else {
                        var msg = {payload:{},topic:"music"};
                        msg.payload.Artist = info.Artist;
                        msg.payload.Album = info.Album;
                        msg.payload.Title = info.Title;
                        msg.payload.Genre = info.Genre;
                        msg.payload.Date = info.Date;
                        if (JSON.stringify(msg) != oldMsg) {
                            node.send(msg);
                            oldMsg = JSON.stringify(msg);
                        }
                    }
                });
            }

            node.mpc.on('changed', function(system) {
                getSong();
            });

            this.on("close", function() {
               // node.mpc.command("stop");
            });
        }
        else { node.warn("MPD not running"); }
    }
    RED.nodes.registerType("mpd in",MPDIn);
}
