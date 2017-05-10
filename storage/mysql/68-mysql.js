
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
        this.setMaxListeners(0);
        var node = this;

        node.pooloptions = {
            host : node.host,
            port : node.port,
            user : node.credentials.user,
            password : node.credentials.password,
            database : node.dbname,
            timezone : node.tz,
            insecureAuth: true,
            multipleStatements: true,
            connectionLimit: 25
        };
        
        function checkVer() {
            node.connection.query("SELECT version();", [], function(err, rows) {
                if (err) {
                    node.connection.release();
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
                node.pool = mysqldb.createPool(node.pooloptions);
            }

            node.pool.getConnection(function(err, connection) {
                node.connecting = false;
                if (err) {
                    node.emit("state",err.code);
                    node.error(err);
                    node.tick = setTimeout(doConnect, reconnect);
                }
                else {
                    node.connection = connection;
                    node.connected = true;
                    node.emit("state","connected");
                    node.connection.on('error', function(err) {
                        node.connected = false;
                        node.connection.release();
                        node.emit("state",err.code);
                        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                            doConnect(); // silently reconnect...
                        }
                        else if (err.code === 'ECONNRESET') {
                            doConnect(); // silently reconnect...
                        }
                        else {
                            node.error(err);
                            doConnect();
                        }
                    });
                    if (!node.check) { node.check = setInterval(checkVer, 290000); }
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
            if (this.check) { clearInterval(this.check); }
            node.connected = false;
            node.emit("state"," ");
            node.pool.end(function (err) { done(); });
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
        this.performQuery = function(msg) {
            var node = this;
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
        this.overRideOptions = function(mysqloptions) {
            /// Overide the connection pool options if they are passed in
            if(mysqloptions === undefined || mysqloptions == null) { return false; }

            var node = this, haschange = false;
            var originalOptions = JSON.stringify(node.mydbConfig.pooloptions);
            var updatedOpptions = JSON.stringify(mysqloptions);
            if(originalOptions !== updatedOpptions) {
                for(var prop in mysqloptions) {
                    if(node.mydbConfig.pooloptions[prop] !== mysqloptions[prop]) {
                        haschange = true;
                        node.mydbConfig.pooloptions[prop] = mysqloptions[prop];
                    }
                }
            }

            return haschange;
        }
        this.reInitializeConnection = function(callBack) {
            var node = this;
            if (node.mydbConfig.tick) { clearTimeout(node.mydbConfig.tick); }
            if (node.mydbConfig.check) { clearInterval(node.mydbConfig.check); }
            node.mydbConfig.connected = false;
            node.mydbConfig.emit("state"," ");
            node.mydbConfig.pool.end(function (err) { 
                node.mydbConfig.pool = null;
                node.mydbConfig.connect();
                node.mydbConfig.on("state", function(info) {
                    if(info === "connected") {
                        callBack();
                    } else {
                        node.error("Error : " + info);
                    }
                });     
            });                       
        }

        if (this.mydbConfig) {
            this.mydbConfig.connect();
            var node = this;
            node.mydbConfig.on("state", function(info) {
                if (info === "connecting") { node.status({fill:"grey",shape:"ring",text:info}); }
                else if (info === "connected") { node.status({fill:"green",shape:"dot",text:info}); }
                else {
                    if (info === "ECONNREFUSED") { info = "connection refused"; }
                    if (info === "PROTOCOL_CONNECTION_LOST") { info = "connection lost"; }
                    node.status({fill:"red",shape:"ring",text:info});
                }
            });

            node.on("input", function(msg) {
                if (node.mydbConfig.connected) {
                    if (typeof msg.topic === 'string') {
                        var changedConfig = node.overRideOptions(msg.mysqloptions);
                        if(changedConfig) {
                            /// Shutdown the existing pool because the options passed in wants us to connect somwhere else
                            node.reInitializeConnection(function() {
                                node.performQuery(msg);
                            });   
                        } else {
                            node.performQuery(msg);     
                        }

                    }
                    else {
                        if (typeof msg.topic !== 'string') { node.error("msg.topic : the query is not defined as a string"); }
                    }
                }
                else {
                    node.error("Database not connected",msg);
                    node.status({fill:"red",shape:"ring",text:"not yet connected"});
                }
            });

            node.on('close', function () {
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
