
module.exports = function(RED) {
    "use strict";
    var snmp = require("net-snmp");

    function SnmpNode(n) {
        RED.nodes.createNode(this,n);
        this.community = n.community || "public";
        this.host = n.host || "127.0.0.1";
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g,"");
        this.session = snmp.createSession(this.host, this.community, {version: this.version});
        var node = this;

        this.on("input",function(msg) {
            var oids = node.oids || msg.oid;
            if (oids) {
                node.session.get(oids.split(","), function(error, varbinds) {
                    if (error) {
                        node.error(error.toString(),msg);
                    } else {
                        for (var i = 0; i < varbinds.length; i++) {
                            if (snmp.isVarbindError(varbinds[i])) {
                                node.error(snmp.varbindError(varbinds[i]),msg);
                            }
                            else {
                                if (varbinds[i].type == 4) { varbinds[i].value = varbinds[i].value.toString(); }
                                varbinds[i].tstr = snmp.ObjectType[varbinds[i].type];
                                //node.log(varbinds[i].oid + "|" + varbinds[i].tstr + "|" + varbinds[i].value);
                            }
                        }
                        msg.oid = oids;
                        msg.payload = varbinds;
                        node.send(msg);
                    }
                });
            }
            else {
                node.warn("No oid(s) to search for");
            }
        });
    }
    RED.nodes.registerType("snmp",SnmpNode);

    function SnmpTNode(n) {
        RED.nodes.createNode(this,n);
        this.community = n.community || "public";
        this.host = n.host || "127.0.0.1";
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g,"");
        this.session = snmp.createSession(this.host, this.community, {version: this.version});
        var node = this;
        var msg;
        var maxRepetitions = 20;

        function sortInt(a, b) {
            if (a > b) { return 1; }
            else if (b > a) { return -1; }
            else { return 0; }
        }

        function responseCb(error, table) {
            if (error) {
                le.error(error.toString());
            } else {
                var indexes = [];
                for (var index in table) {
                    if (table.hasOwnProperty(index)) {
                        indexes.push(parseInt(index));
                    }
                }
                indexes.sort(sortInt);
                for (var i = 0; i < indexes.length; i++) {
                    var columns = [];
                    for (var column in table[indexes[i]]) {
                        if (table[indexes[i]].hasOwnProperty(column)) {
                            columns.push(parseInt(column));
                        }
                    }
                    columns.sort(sortInt);
                    // console.log("row index = " + indexes[i]);
                    // for (var j = 0; j < columns.length; j++) {
                    //     console.log("  column " + columns[j] + " = " + table[indexes[i]][columns[j]]);
                    // }
                }
                msg.payload = table;
                node.send(msg);
            }
        }

        this.on("input",function(m) {
            msg = m;
            var oids = node.oids || msg.oid;
            if (oids) {
                msg.oid = oids;
                node.session.table(oids, maxRepetitions, responseCb);
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp table",SnmpTNode);

    function SnmpSubtreeNode(n) {
        RED.nodes.createNode(this,n);
        this.community = n.community || "public";
        this.host = n.host || "127.0.0.1";
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g,"");
        this.session = snmp.createSession(this.host, this.community, {version: this.version});
        var node = this;
        var maxRepetitions = 20;
        var response = [];

        function doneCb(error) {
            if (error) {
                console.error(error.toString());
            }
            else {
                var msg = {};
                msg.payload = response;
                node.send(msg);
                response.clear();
            }
        }

        function feedCb(varbinds) {
            for (var i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) {
                    node.error(snmp.varbindError(varbinds[i]));
                }
                else {
                    //console.log(varbinds[i].oid + "|" + varbinds[i].value);
                    response.add({oid: varbinds[i].oid, value: varbinds[i].value});
                }
            }
        }

        this.on("input",function(msg) {
            var oids = node.oids || msg.oid;
            if (oids) {
                msg.oid = oids;
                node.session.subtree(msg.oid, maxRepetitions, feedCb, doneCb);
                //node.session.subtree(oids, maxRepetitions, responseCb);
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp subtree",SnmpSubtreeNode);

    function SnmpWalkerNode(n) {
        RED.nodes.createNode(this,n);
        this.community = n.community || "public";
        this.host = n.host || "127.0.0.1";
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g,"");
        this.session = snmp.createSession(this.host, this.community, {version: this.version});
        var node = this;
        var maxRepetitions = 20;
        var response = [];

        function doneCb(error) {
            if (error) {
                node.error(error.toString());
            }
            else {
                var msg = {};
                msg.payload = response;
                node.send(msg);
                response.clear();
            }
        }

        function feedCb(varbinds) {
            for (var i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) {
                    node.error(snmp.varbindError(varbinds[i]));
                }
                else {
                    //console.log(varbinds[i].oid + "|" + varbinds[i].value);
                    response.add({oid: varbinds[i].oid, value: varbinds[i].value});
                }
            }
        }

        this.on("input",function(msg) {
            var oids = node.oids || msg.oid;
            if (oids) {
                msg.oid = oids;
                node.session.walk(msg.oid, maxRepetitions, feedCb, doneCb);
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp walker",SnmpWalkerNode);
};
