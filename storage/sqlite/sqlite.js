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

        if (this.mydbConfig) {
            this.mydbConfig.doConnect();
            var bind = [];
            node.on("input", function(msg) {
                if (this.sqlquery == "msg.topic"){
                    if (typeof msg.topic === 'string') {
                        bind = Array.isArray(msg.payload) ? msg.payload : [];
                        node.mydbConfig.db.all(msg.topic, bind, function(err, row) {
                            if (err) { node.error(err,msg); }
                            else {
                                msg.payload = row;
                                node.send(msg);
                            }
                        });
                    }
                    else {
                        if (typeof msg.topic !== 'string') {
                            node.error("msg.topic : the query is not defined as a string",msg);
                            node.status({fill:"red",shape:"dot",text:"msg.topic error"});
                        }
                    }
                }
                if (this.sqlquery == "fixed"){
                    if (typeof this.sql === 'string'){
                        bind = Array.isArray(msg.payload) ? msg.payload : [];
                        node.mydbConfig.db.all(this.sql, bind, function(err, row) {
                            if (err) { node.error(err,msg); }
                            else {
                                msg.payload = row;
                                node.send(msg);
                            }
                        });
                    }
                    else{
                        if (this.sql === null || this.sql == ""){
                            node.error("SQL statement config not set up",msg);
                            node.status({fill:"red",shape:"dot",text:"SQL config not set up"});
                        }
                    }
                }
                if (this.sqlquery == "prepared"){
                    if (typeof this.sql === 'string' && typeof msg.params !== "undefined" && typeof msg.params === "object"){
                        node.mydbConfig.db.all(this.sql, msg.params, function(err, row) {
                            if (err) { node.error(err,msg); }
                            else {
                                msg.payload = row;
                                node.send(msg);
                            }
                        });
                    }
                    else{
                        if (this.sql === null || this.sql == ""){
                            node.error("Prepared statement config not set up",msg);
                            node.status({fill:"red",shape:"dot",text:"Prepared statement not set up"});
                        }
                        if (typeof msg.params == "undefined"){
                            node.error("msg.params not passed");
                            node.status({fill:"red",shape:"dot",text:"msg.params not defined"});
                        }
                        else if (typeof msg.params != "object"){
                            node.error("msg.params not an object");
                            node.status({fill:"red",shape:"dot",text:"msg.params not an object"});
                        }
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
