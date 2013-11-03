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
var komponist = require('komponist');

var mpc = "";
komponist.createConnection(6600, 'localhost', function(err, client) {
    if (err) node.error("MPD: Failed to connect to MPD server");
    mpc = client;
});

function MPDOut(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.mpc = mpc;

    this.on("input", function(msg) {
        if (msg != null) {
            console.log(msg);
            try {
                //node.mpc.command(msg.payload);
                node.mpc.command(msg.payload, msg.param, function(err, results) {
                    if (err) { console.log("MPD: Error:",err); }
                    else { node.error(results); }
                });
            } catch(err) { console.log("MPD: Error:",err); }
        }
    });

    node.mpc.on('error', function(err) {
        console.log("MPD: Error:",err);
    });
}
RED.nodes.registerType("mpd out",MPDOut);

function MPDIn(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.mpc = mpc;
    var oldMsg = "";

    getSong();

    function getSong() {
        node.mpc.currentsong(function(err, info) {
            if (err) console.log(err);
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
RED.nodes.registerType("mpd in",MPDIn);
