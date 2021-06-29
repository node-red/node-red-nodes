
module.exports = function(RED) {
    "use strict";
    var reconnect = RED.settings.mysqlReconnectTime || 20000;
    var mysqldb = require('mysql');

    function MySQLNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        this.tz = n.tz || "local";
        this.charset = (n.charset || "UTF8_GENERAL_CI").toUpperCase();

        this.connected = false;
        this.connecting = false;

        this.dbname = n.db;
        this.setMaxListeners(0);
        var node = this;

        function checkVer() {
            node.pool.query("SELECT version();", [], function(err, rows, fields) {
                if (err) {
                    node.error(err);
                    node.status({fill:"red",shape:"ring",text:"Bad Ping"});
                    doConnect();
                }
            });
        }

        function doConnect() {
            node.connecting = true;
            node.emit("state","connecting");
            if (!node.pool) {
                node.pool = mysqldb.createPool({
                    host : node.host,
                    port : node.port,
                    user : node.credentials.user,
                    password : node.credentials.password,
                    database : node.dbname,
                    timezone : node.tz,
                    insecureAuth: true,
                    multipleStatements: true,
                    connectionLimit: 50,
                    timeout: 30000,
                    connectTimeout: 30000,
                    charset: node.charset
                });
            }

            // connection test
            node.pool.getConnection(function(err, connection) {
                node.connecting = false;
                if (err) {
                    node.emit("state",err.code);
                    node.error(err);
                    node.tick = setTimeout(doConnect, reconnect);
                }
                else {
                    node.connected = true;
                    node.emit("state","connected");
                    if (!node.check) { node.check = setInterval(checkVer, 290000); }
                    connection.release();
                }
            });
        }

        this.connect = function() {
            if (!this.connected && !this.connecting) {
                doConnect();
            }
        }

        this.on('close', function(done) {
            if (this.tick) { clearTimeout(this.tick); }
            if (this.check) { clearInterval(this.check); }
            node.connected = false;
            // node.connection.release();
            node.emit("state"," ");
            node.pool.end(function(err) { done(); });
        });
    }
    RED.nodes.registerType("MySQLdatabase",MySQLNode, {
        credentials: {
            user: {type: "text"},
            password: {type: "password"}
        }
    });


    function MysqlDBNodeIn(n) {
        RED.nodes.createNode(this,n);
        this.mydb = n.mydb;
        this.mydbConfig = RED.nodes.getNode(this.mydb);
        this.status({});

        if (this.mydbConfig) {
            this.mydbConfig.connect();
            var node = this;
            var busy = false;
            var status = {};
            node.mydbConfig.on("state", function(info) {
                if (info === "connecting") { node.status({fill:"grey",shape:"ring",text:info}); }
                else if (info === "connected") { node.status({fill:"green",shape:"dot",text:info}); }
                else {
                    node.status({fill:"red",shape:"ring",text:info});
                }
            });

            node.on("input", function(msg, send, done) {
                send = send || function() { node.send.apply(node,arguments) };
                if (node.mydbConfig.connected) {
                    if (typeof msg.topic === 'string') {
                        //console.log("query:",msg.topic);
                        var bind = [];
                        if (Array.isArray(msg.payload)) { bind = msg.payload; }
                        else if (typeof msg.payload === 'object' && msg.payload !== null) {
                            bind = msg.payload;
                            node.mydbConfig.pool.config.queryFormat = function(query, values) {
                                if (!values) {
                                    return query;
                                }
                                return query.replace(/\:(\w+)/g, function(txt, key) {
                                    if (values.hasOwnProperty(key)) {
                                        return this.escape(values[key]);
                                    }
                                    return txt;
                                }.bind(this));
                            };
                        }
                        node.mydbConfig.pool.query(msg.topic, bind, function(err, rows) {
                            if (err) {
                                status = {fill:"red",shape:"ring",text:"Error: "+err.code};
                                node.status(status);
                                node.error(err,msg);
                            }
                            else {
                                // if (rows.constructor.name === "OkPacket") {
                                //     msg.payload = JSON.parse(JSON.stringify(rows));
                                // }
                                // else if (rows.constructor.name === "Array") {
                                //     if (rows[0] && rows[0].constructor.name === "RowDataPacket") {
                                //         msg.payload = rows.map(v => Object.assign({}, v));
                                //     }
                                //     else if (rows[0] && rows[0].constructor.name === "Array") {
                                //         if (rows[0][0] && rows[0][0].constructor.name === "RowDataPacket") {
                                //             msg.payload = rows.map(function(v) {
                                //                 if (!Array.isArray(v)) { return v; }
                                //                 v.map(w => Object.assign({}, w))
                                //             });
                                //         }
                                //         else { msg.payload = rows; }
                                //     }
                                //     else  { msg.payload = rows; }
                                // }
                                // else { msg.payload = rows; }
                                msg.payload = rows;
                                send(msg);
                                status = {fill:"green",shape:"dot",text:"OK"};
                                node.status(status);
                            }
                            if (done) { done(); }
                            // if (node.mydbConfig.pool._freeConnections.indexOf(node.mydbConfig.connection) === -1) {
                            //     node.mydbConfig.connection.release();
                            // }
                        });
                    }
                    else {
                        if (typeof msg.topic !== 'string') { node.error("msg.topic : the query is not defined as a string"); done(); }
                    }
                }
                else {
                    node.error("Database not connected",msg);
                    status = {fill:"red",shape:"ring",text:"not yet connected"};
                    if (done) { done(); }
                }
                if (!busy) {
                    busy = true;
                    node.status(status);
                    node.tout = setTimeout(function() { busy = false; node.status(status); },500);
                }
            });

            node.on('close', function() {
                if (node.tout) { clearTimeout(node.tout); }
                node.mydbConfig.removeAllListeners();
                node.status({});
            });
        }
        else {
            this.error("MySQL database not configured");
        }
    }
    RED.nodes.registerType("mysql",MysqlDBNodeIn);
}
