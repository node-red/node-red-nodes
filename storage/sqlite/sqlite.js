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
    var reconnect = RED.settings.sqliteReconnectTime || 20000;
    var sqlite3 = require('sqlite3');

    function SqliteNodeDB(n) {
        RED.nodes.createNode(this,n);

        this.dbname = n.db;
        var node = this;

        node.doConnect = function() {
            node.db = new sqlite3.Database(node.dbname);
            node.db.on('open',function(err) {
                 if (node.tick) { clearTimeout(node.tick); }
                 node.log("opened "+node.dbname+" ok");
            });
            node.db.on('error', function(err) {
                node.warn(err);
                node.log("failed to open "+node.dbname);
                node.tick = setTimeout(doConnect, reconnect);
            });
        }

        node.on('close', function () {
            if (node.tick) { clearTimeout(node.tick); }
            if (node.db) { node.db.close(); }
        });
    }
    RED.nodes.registerType("sqlitedb",SqliteNodeDB);


    function SqliteNodeIn(n) {
        RED.nodes.createNode(this,n);
        this.mydb = n.mydb;
        this.mydbConfig = RED.nodes.getNode(this.mydb);

        if (this.mydbConfig) {
            this.mydbConfig.doConnect();
            var node = this;
            node.on("input", function(msg) {
                if (typeof msg.topic === 'string') {
                    //console.log("query:",msg.topic);
                    node.mydbConfig.db.all(msg.topic, function(err, row) {
                        if (err) { node.warn(err); }
                        else {
                            msg.payload = row;
                            node.send(msg);
                        }
                    });
                }
                else {
                    if (typeof msg.topic !== 'string') {
                        node.error("msg.topic : the query is not defined as a string");
                    }
                }
            });
        }
        else {
            this.error("Sqlite database not configured");
        }
    }
    RED.nodes.registerType("sqlite",SqliteNodeIn);
}
