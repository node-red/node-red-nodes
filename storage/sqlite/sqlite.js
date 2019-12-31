module.exports = function(RED) {
    "use strict";
    var reconnect = RED.settings.sqliteReconnectTime || 20000;
    var sqlite3 = require('sqlite3');

    function SqliteNodeDB(n) {
        RED.nodes.createNode(this,n);

        this.dbname = n.db;
        this.mod = n.mode;
        if (n.mode === "RWC") { this.mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE; }
        if (n.mode === "RW") { this.mode = sqlite3.OPEN_READWRITE; }
        if (n.mode === "RO") { this.mode = sqlite3.OPEN_READONLY; }
        var node = this;

        node.doConnect = function() {
            node.db = node.db || new sqlite3.Database(node.dbname,node.mode);
            node.db.on('open', function() {
                if (node.tick) { clearTimeout(node.tick); }
                node.log("opened "+node.dbname+" ok");
            });
            node.db.on('error', function(err) {
                node.error("failed to open "+node.dbname, err);
                node.tick = setTimeout(function() { node.doConnect(); }, reconnect);
            });
        }

        node.on('close', function (done) {
            if (node.tick) { clearTimeout(node.tick); }
            if (node.db) { node.db.close(done()); }
            else { done(); }
        });
    }
    RED.nodes.registerType("sqlitedb",SqliteNodeDB);


    function SqliteNodeIn(n) {
        RED.nodes.createNode(this,n);
        this.mydb = n.mydb;
        this.sqlquery = n.sqlquery||"msg.topic";
        this.sql = n.sql;
        this.mydbConfig = RED.nodes.getNode(this.mydb);
        var node = this;
        node.status({});

        if (node.mydbConfig) {
            node.mydbConfig.doConnect();
            node.status({fill:"green",shape:"dot",text:this.mydbConfig.mod});
            var bind = [];

            var doQuery = function(msg) {
                if (node.sqlquery == "msg.topic") {
                    if (typeof msg.topic === 'string') {
                        if (msg.topic.length > 0) {
                            bind = Array.isArray(msg.payload) ? msg.payload : [];
                            node.mydbConfig.db.all(msg.topic, bind, function(err, row) {
                                if (err) { node.error(err,msg); }
                                else {
                                    msg.payload = row;
                                    node.send(msg);
                                }
                            });
                        }
                    }
                    else {
                        node.error("msg.topic : the query is not defined as a string",msg);
                        node.status({fill:"red",shape:"dot",text:"msg.topic error"});
                    }
                }
                if (node.sqlquery == "batch") {
                    if (typeof msg.topic === 'string') {
                        if (msg.topic.length > 0) {
                            node.mydbConfig.db.exec(msg.topic, function(err) {
                                if (err) { node.error(err,msg);}
                                else {
                                    msg.payload = [];
                                    node.send(msg);
                                }
                            });
                        }
                    }
                    else {
                        node.error("msg.topic : the query is not defined as string", msg);
                        node.status({fill:"red", shape:"dot",text:"msg.topic error"});
                    }
                }
                if (node.sqlquery == "fixed") {
                    if (typeof node.sql === 'string') {
                        if (node.sql.length > 0) {
                            node.mydbConfig.db.all(node.sql, bind, function(err, row) {
                                if (err) { node.error(err,msg); }
                                else {
                                    msg.payload = row;
                                    node.send(msg);
                                }
                            });
                        }
                    }
                    else {
                        if (node.sql === null || node.sql == "") {
                            node.error("SQL statement config not set up",msg);
                            node.status({fill:"red",shape:"dot",text:"SQL config not set up"});
                        }
                    }
                }
                if (node.sqlquery == "prepared") {
                    if (typeof node.sql === 'string' && typeof msg.params !== "undefined" && typeof msg.params === "object") {
                        if (node.sql.length > 0) {
                            node.mydbConfig.db.all(node.sql, msg.params, function(err, row) {
                                if (err) { node.error(err,msg); }
                                else {
                                    msg.payload = row;
                                    node.send(msg);
                                }
                            });
                        }
                    }
                    else {
                        if (node.sql === null || node.sql == "") {
                            node.error("Prepared statement config not set up",msg);
                            node.status({fill:"red",shape:"dot",text:"Prepared statement not set up"});
                        }
                        if (typeof msg.params == "undefined") {
                            node.error("msg.params not passed");
                            node.status({fill:"red",shape:"dot",text:"msg.params not defined"});
                        }
                        else if (typeof msg.params != "object") {
                            node.error("msg.params not an object");
                            node.status({fill:"red",shape:"dot",text:"msg.params not an object"});
                        }
                    }
                }
            }

            node.on("input", function(msg) {
                if (msg.hasOwnProperty("extension")) {
                    node.mydbConfig.db.loadExtension(msg.extension, function(err) {
                        if (err) { node.error(err,msg); }
                        else { doQuery(msg); }
                    });
                }
                else { doQuery(msg); }
            });
        }
        else {
            node.error("Sqlite database not configured");
        }
    }
    RED.nodes.registerType("sqlite",SqliteNodeIn);
}
