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
var reconnect = RED.settings.mysqlReconnectTime || 30000;
var mysqldb = require('mysql');

function MySQLNode(n) {
    RED.nodes.createNode(this,n);
    this.host = n.host;
    this.port = n.port;
    this.user = n.user;
    this.password = n.pass;
    this.dbname = n.db;
    var node = this;

    function doConnect() {
        node.connection = mysqldb.createConnection({
            host : node.host,
            port : node.port,
            user : node.user,
            password : node.password,
            database : node.dbname,
            insecureAuth: true
        });

        node.connection.connect(function(err) {
            if (err) {
                node.warn("mysql: "+err);
                node.tick = setTimeout(doConnect, reconnect);
            }
        });

        node.connection.on('error', function(err) {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                doConnect(); // silently reconnect...
            } else {
                node.error(err);
                doConnect();
            }
        });
    }
    doConnect();

    node.on('close', function () {
        if (node.tick) { clearTimeout(node.tick); }
        node.connection.end(function(err) {
            if (err) node.error(err);
        });
    });
}
RED.nodes.registerType("MySQLdatabase",MySQLNode);


function MysqlDBNodeIn(n) {
    RED.nodes.createNode(this,n);
    this.mydb = n.mydb;
    this.mydbConfig = RED.nodes.getNode(this.mydb);

    if (this.mydbConfig) {
        var node = this;
        node.on("input", function(msg) {
            if (typeof msg.topic === 'string') {
                //console.log("query:",msg.topic);
                node.mydbConfig.connection.query(msg.topic, function(err, rows) {
                    if (err) { node.warn(err); }
                    else {
                        msg.payload = rows;
                        node.send(msg);
                    }
                });
            }
            else {
                if (typeof msg.topic !== 'string') node.error("msg.topic : the query is not defined as a string");
            }
        });
    }
    else {
        this.error("MySQL database not configured");
    }
}
RED.nodes.registerType("mysql",MysqlDBNodeIn);


//function MysqlDBNodeOut(n) {
    //RED.nodes.createNode(this,n);
    //this.level = n.level;
    //this.operation = n.operation;
    //this.levelConfig = RED.nodes.getNode(this.level);

    //if (this.levelConfig) {
        //var node = this;
        //node.on("input", function(msg) {
            //if (typeof msg.topic === 'string') {
                //if (node.operation === "delete") {
                    //node.levelConfig.db.del(msg.topic);
                //}
                //else {
                    //node.levelConfig.db.put(msg.topic, msg.payload, function(err) {
                        //if (err) node.error(err);
                    //});
                //}
            //}
            //else {
                //if (typeof msg.topic !== 'string') node.error("msg.topic : the key is not defined");
            //}
        //});
    //}
    //else {
        //this.error("MySQL database not configured");
    //}
//}
//RED.nodes.registerType("mysql out",MysqlDBNodeOut);
