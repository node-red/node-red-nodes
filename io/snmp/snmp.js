
module.exports = function (RED) {
    "use strict";
    var snmp = require("net-snmp");

    var sessions = {};

    function getSession(host, community, version) {
        var sessionKey = host + ":" + community + ":" + version;
        if (!(sessionKey in sessions)) {
            sessions[sessionKey] = snmp.createSession(host, community, { version: version });
        }
        return sessions[sessionKey];
    }

    function SnmpNode(n) {
        RED.nodes.createNode(this, n);
        this.community = n.community;
        this.host = n.host;
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g, "");
        var node = this;

        this.on("input", function (msg) {
            var host = node.host || msg.host;
            var community = node.community || msg.community;
            var oids = node.oids || msg.oid;
            if (oids) {
                getSession(host, community, node.version).get(oids.split(","), function (error, varbinds) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
                        for (var i = 0; i < varbinds.length; i++) {
                            if (snmp.isVarbindError(varbinds[i])) {
                                node.error(snmp.varbindError(varbinds[i]), msg);
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
    RED.nodes.registerType("snmp", SnmpNode);


    function SnmpSNode(n) {
        RED.nodes.createNode(this, n);
        this.community = n.community;
        this.host = n.host;
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        var node = this;
        var objectTypes = {
            "Boolean": 1,
            "Integer": 2,
            "OctetString": 4,
            "Null": 5,
            "OID": 6,
            "IpAddress": 7,
            "Counter": 8,
            "Gauge": 66,
            "TimeTicks": 67,
            "Opaque": 68,
            "Counter64": 70,
            "NoSuchObject": 128,
            "NoSuchInstance": 129,
            "EndOfMibView": 130
        };

        this.on("input", function (msg) {
            var host = msg.host || node.host;
            var community = msg.community || node.community;
            var varbinds = msg.varbinds;

            if (varbinds) {
                for (var i = 0; i < varbinds.length; i++) {
                    varbinds[i].type = objectTypes[varbinds[i].type];
                }
                getSession(host, community, node.version).set(varbinds, function (error, varbinds) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
                        for (var i = 0; i < varbinds.length; i++) {
                            // for version 2c we must check each OID for an error condition
                            if (snmp.isVarbindError(varbinds[i]))
                                node.error(snmp.varbindError(varbinds[i]), msg);
                        }
                    }
                });
            }
            else {
                node.warn("No oid(s) to set");
            }
        });

    }
    RED.nodes.registerType("snmp set", SnmpSNode);




    function SnmpTNode(n) {
        RED.nodes.createNode(this, n);
        this.community = n.community;
        this.host = n.host;
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g, "");
        var node = this;
        var maxRepetitions = 20;

        function sortInt(a, b) {
            if (a > b) { return 1; }
            else if (b > a) { return -1; }
            else { return 0; }
        }

        this.on("input", function (msg) {
            var host = node.host || msg.host;
            var community = node.community || msg.community;
            var oids = node.oids || msg.oid;
            if (oids) {
                msg.oid = oids;
                getSession(host, community, node.version).table(oids, maxRepetitions, function (error, table) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
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
                });
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp table", SnmpTNode);

    function SnmpSubtreeNode(n) {
        RED.nodes.createNode(this, n);
        this.community = n.community;
        this.host = n.host;
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g, "");
        var node = this;
        var maxRepetitions = 20;
        var response = [];

        function feedCb(varbinds) {
            for (var i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) {
                    node.error(snmp.varbindError(varbinds[i]), msg);
                }
                else {
                    //console.log(varbinds[i].oid + "|" + varbinds[i].value);
                    response.push({ oid: varbinds[i].oid, value: varbinds[i].value });
                }
            }
        }

        this.on("input", function (msg) {
            var host = node.host || msg.host;
            var community = node.community || msg.community;
            var oids = node.oids || msg.oid;
            if (oids) {
                msg.oid = oids;
                getSession(host, community, node.version).subtree(msg.oid, maxRepetitions, feedCb, function (error) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
                        msg.payload = response;
                        node.send(msg);
                        //Clears response
                        response.length = 0;
                    }
                });
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp subtree", SnmpSubtreeNode);

    function SnmpWalkerNode(n) {
        RED.nodes.createNode(this, n);
        this.community = n.community;
        this.host = n.host;
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g, "");
        var node = this;
        var maxRepetitions = 20;
        var response = [];

        function feedCb(varbinds) {
            for (var i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) {
                    node.error(snmp.varbindError(varbinds[i]), msg);
                }
                else {
                    //console.log(varbinds[i].oid + "|" + varbinds[i].value);
                    response.push({ oid: varbinds[i].oid, value: varbinds[i].value });
                }
            }
        }

        this.on("input", function (msg) {
            node.msg = msg;
            var oids = node.oids || msg.oid;
            var host = node.host || msg.host;
            var community = node.community || msg.community;
            if (oids) {
                msg.oid = oids;
                getSession(host, community, node.version).walk(msg.oid, maxRepetitions, feedCb, function (error) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
                        msg.payload = response;
                        node.send(msg);
                        //Clears response
                        response.length = 0;
                    }
                });
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp walker", SnmpWalkerNode);
};
