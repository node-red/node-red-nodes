
module.exports = function(RED) {
    "use strict";
    var reconnect = RED.settings.mysqlReconnectTime || 20000;
    var mysqldb = require('mysql');

    function MySQLNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        this.tz = n.tz || "local";

        this.connected = false;
        this.connecting = false;

        this.dbname = n.db;
        var node = this;

        function doConnect() {
            node.connecting = true;
            node.connection = mysqldb.createConnection({
                host : node.host,
                port : node.port,
                user : node.credentials.user,
                password : node.credentials.password,
                database : node.dbname,
                timezone : node.tz,
                insecureAuth: true,
                multipleStatements: true
            });

            node.connection.connect(function(err) {
                node.connecting = false;
                if (err) {
                    node.error(err);
                    node.tick = setTimeout(doConnect, reconnect);
                } else {
                    node.connected = true;
                }
            });

            node.connection.on('error', function(err) {
                node.connected = false;
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    doConnect(); // silently reconnect...
                } else {
                    node.error(err);
                    doConnect();
                }
            });
        }

        this.connect = function() {
            if (!this.connected && !this.connecting) {
                doConnect();
            }
        }

        this.on('close', function (done) {
            if (this.tick) { clearTimeout(this.tick); }
            node.connected = false;
            if (this.connection) {
                node.connection.end(function(err) {
                    if (err) { node.error(err); }
                    done();
                });
            } else {
                done();
            }
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

        if (this.mydbConfig) {
            this.mydbConfig.connect();
            var node = this;
            node.on("input", function(msg) {
                if (node.mydbConfig.connected) {
                    node.status({fill:"green",shape:"dot",text:"connected"});
                    if (typeof msg.topic === 'string') {
                        //console.log("query:",msg.topic);
                        var bind = Array.isArray(msg.payload) ? msg.payload : [];
                        node.mydbConfig.connection.query(msg.topic, bind, function(err, rows) {
                            if (err) {
                                node.error(err,msg);
                                node.status({fill:"red",shape:"ring",text:"Error"});
                            }
                            else {
                                msg.payload = rows;
                                node.send(msg);
                                node.status({fill:"green",shape:"dot",text:"OK"});
                            }
                        });
                    }
                    else {
                        if (typeof msg.topic !== 'string') { node.error("msg.topic : the query is not defined as a string"); }
                    }
                }
                else {
                    node.error("Database not connected",msg);
                    node.status({fill:"grey",shape:"ring",text:"Not connected"});
                }
            });
        }
        else {
            this.error("MySQL database not configured");
        }
    }
    RED.nodes.registerType("mysql",MysqlDBNodeIn);
}
