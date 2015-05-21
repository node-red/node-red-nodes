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
    var lvldb = require('level');

    function LevelNode(n) {
        RED.nodes.createNode(this,n);
        this.dbname = n.db;
        this.ready = false;
        var node = this;
        lvldb(this.dbname, function(err, db) {
            if (err) { node.error(err); }
            node.db = db;
            node.db.on('ready', function() { node.ready = true; });
            node.db.on('closing', function() { node.ready = false; });
        });
        node.on('close', function() {
            if (node.db) {
                node.ready = false;
                node.db.close();
            }
        });
    }
    RED.nodes.registerType("leveldbase",LevelNode);


    function LevelDBNodeIn(n) {
        RED.nodes.createNode(this,n);
        this.level = n.level;
        this.levelConfig = RED.nodes.getNode(this.level);

        var node = this;
        node.on("input", function(msg) {
            if (node.levelConfig && node.levelConfig.ready) {
                var key = msg.topic.toString();
                if (key && (key.length > 0)) {
                    node.levelConfig.db.get(msg.topic, function(err, value) {
                        if (err) {
                            //node.warn(err);
                            // for some reason they treat nothing found as an error...
                            msg.payload = null;  // so we should return null
                        }
                        else { msg.payload = value; }
                        node.send(msg);
                    });
                }
                else { node.error("Cannot make key string from msg.topic"); }
            }
            else { node.error("Database not ready",msg); }
        });
    }
    RED.nodes.registerType("leveldb in",LevelDBNodeIn);


    function LevelDBNodeOut(n) {
        RED.nodes.createNode(this,n);
        this.level = n.level;
        this.operation = n.operation;
        this.levelConfig = RED.nodes.getNode(this.level);

        var node = this;
        node.on("input", function(msg) {
            if (node.levelConfig && node.levelConfig.ready) {
                var key = msg.topic.toString();
                if (key && (key.length > 0)) {
                    if (node.operation === "delete") {
                        node.levelConfig.db.del(msg.topic);
                    }
                    else {
                        node.levelConfig.db.put(msg.topic, msg.payload, function(err) {
                            if (err) { node.error(err); }
                        });
                    }
                }
                else { node.error("Cannot make key string from msg.topic"); }
            }
            else { node.error("Database not ready",msg); }
        });
    }
    RED.nodes.registerType("leveldb out",LevelDBNodeOut);
}
