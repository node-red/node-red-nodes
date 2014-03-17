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
var reconnect = RED.settings.sqliteReconnectTime || 30000;
var sqlitedb = require('sqlite3');
var querystring = require('querystring');

RED.httpAdmin.get('/SQLitedatabase/:id',function(req,res) {
});

RED.httpAdmin.delete('/SQLitedatabase/:id',function(req,res) {
});

RED.httpAdmin.post('/SQLitedatabase/:id',function(req,res) {
});


function SQLiteNode(n) {
    RED.nodes.createNode(this,n);
    this.file = n.file;

    this.connected = false;
    this.connecting = false;
    
    var node = this;

    function doConnect() {
        node.connecting = true;
        node.connection = new sqlitedb.Database(node.file);

        node.connection.on('error', function(err) {
            if( err ){
                console.log('db failed');
                node.connected = false;
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    doConnect(); // silently reconnect...
                } else {
                    node.error(err);
                    doConnect();
                }
            }else{
                console.log('db ok');
                node.connected = true;
            }
        });
    }

    this.connect = function() {
        if (!this.connected && !this.connecting) {
            doConnect();
        }
    }

    this.on('close', function () {
        if (this.tick) { clearTimeout(this.tick); }
        if (this.connection) {
            node.connection.close(function(err) {
                if (err) node.error(err);
            });
        }
    });
}
RED.nodes.registerType("SQLitedatabase",SQLiteNode);


function SQLiteDBNodeIn(n) {
    RED.nodes.createNode(this,n);
    this.mydb = n.mydb;
    this.mydbConfig = RED.nodes.getNode(this.mydb);

    if (this.mydbConfig) {
        this.mydbConfig.connect();
        this.dbname = n.db;
        var node = this;
        node.on("input", function(msg) {
            if (typeof msg.payload === 'string') {
                node.mydbConfig.connection.all(msg.payload, function(err, rows) {
                    if (err) { node.warn(err); }
                    else {
                        msg.payload = rows;
                        node.send(msg);
                    }
                });
            }
            else {
                if (typeof msg.topic !== 'string') node.error("msg.payload : the query is not defined as a string");
            }
        });
    }
    else {
        this.error("SQLite database not configured");
    }
}
RED.nodes.registerType("sqlite",SQLiteDBNodeIn);

