
module.exports = function (RED) {
    "use strict";
    var snmp = require("net-snmp");

    var sessions = {};

    function openSession(host, data, options) {
        //console.log({data});
        //console.log({options});
        var sessionid = data.sessionid;
        options.port = 161;
        if (host.indexOf(":") !== -1) {
            options.port = host.split(":")[1];
            host = host.split(":")[0];
        }
        // SNMPv3 call
        if (options.version === "v3"){
            var user = {};
            options.version = snmp.Version3;
            user.name = data.name || "";
            user.level = snmp.SecurityLevel.noAuthNoPriv;
            if (data.auth === "authNoPriv" || data.auth === "authPriv" ) {
                user.level = snmp.SecurityLevel.authNoPriv;
                user.authKey = data.authkey || "";
                user.authProtocol = (data.authprot === "SHA") ? snmp.AuthProtocols.sha : snmp.AuthProtocols.md5;
                if (data.auth === "authPriv" ) {
                    user.level = snmp.SecurityLevel.authPriv;
                    if (data.privprot === "DES" || data.privprot === "AES"){
                        user.privProtocol = (data.privprot === "AES") ? snmp.PrivProtocols.aes : snmp.PrivProtocols.des;
                        user.privKey = data.privkey || "";
                    }
                }
            }
            sessions[sessionid] = snmp.createV3Session(host, user, options);
        }
        // SNMPv1 or SNMPv2c call
        else{
            var community = data.community;
            options.version = (options.version === "v2c") ? snmp.Version2c : snmp.Version1;
            sessions[sessionid] = snmp.createSession(host, community, options);
        }
        return sessions[sessionid];
    }

    // Any session needs to be closed after completion
    function closeSession(sessionid) {
        //console.log("closing session");
        sessions[sessionid].close();
    }

    function SnmpNode(n) {
        RED.nodes.createNode(this, n);
        this.community = n.community;
        this.host = n.host;
        this.version = n.version;
        this.username = n.username;
        this.auth = n.auth;
        this.authprot = n.authprot;
        this.privprot = n.privprot;
        this.authkey = n.authkey;
        this.privkey = n.privkey;
        this.oids = n.oids.replace(/\s/g, "");
        this.timeout = Number(n.timeout || 5) * 1000;
        var node = this;

        this.on("input", function (msg) {
            var host = node.host || msg.host;
            var version = node.version;
            var community = node.community || msg.community;
            var username = node.username || msg.username;
            var auth = node.auth;
            var authprot = node.authprot;
            var privprot = node.privprot;
            var authkey = node.authkey || msg.authkey;
            var privkey = node.privkey || msg.privkey;
            var oids = node.oids || msg.oid;
            var sessionid = Date.now(); // Create an unique session ID for each call
            var data = {};
            data.community = community;
            data.name = username;
            data.auth = auth;
            data.authprot = authprot;
            data.privprot = privprot;
            data.authkey = authkey;
            data.privkey = privkey;
            data.sessionid = sessionid;
            var options = {};
            options.version = version;
            options.timeout = node.timeout;
            if (oids) {
                openSession(host, data, options).get(oids.split(","), function (error, varbinds) {
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
                                // node.log(varbinds[i].oid + "|" + varbinds[i].tstr + "|" + varbinds[i].value);
                            }
                        }
                        msg.oid = oids;
                        msg.payload = varbinds;
                        node.send(msg);
                    }
                    closeSession(sessionid); // Needed to close the session else a bad or good read could affect future readings
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
        this.version = n.version;
        this.username = n.username;
        this.auth = n.auth;
        this.authprot = n.authprot;
        this.privprot = n.privprot;
        this.authkey = n.authkey;
        this.privkey = n.privkey;
        this.timeout = Number(n.timeout || 5) * 1000;
        this.varbinds = n.varbinds;
        if (this.varbinds && this.varbinds.trim().length === 0) { delete this.varbinds; }
        var node = this;
        this.on("input", function (msg) {
            var host = node.host || msg.host;
            var version = node.version;
            var community = node.community || msg.community;
            var username = node.username || msg.username;
            var auth = node.auth;
            var authprot = node.authprot;
            var privprot = node.privprot;
            var authkey = node.authkey || msg.authkey;
            var privkey = node.privkey || msg.privkey;
            var sessionid = Date.now();
            var data = {};
            data.community = community;
            data.name = username;
            data.auth = auth;
            data.authprot = authprot;
            data.privprot = privprot;
            data.authkey = authkey;
            data.privkey = privkey;
            data.sessionid = sessionid;
            var options = {};
            options.version = version;
            options.timeout = node.timeout;
            var varbinds = (node.varbinds) ? JSON.parse(node.varbinds) : msg.varbinds;
            if (varbinds) {
                for (var i = 0; i < varbinds.length; i++) {
                    varbinds[i].type = snmp.ObjectType[varbinds[i].type];
                }
                openSession(host, data, options).set(varbinds, function (error, varbinds) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
                        for (var i = 0; i < varbinds.length; i++) {
                            // for version 2c we must check each OID for an error condition
                            if (snmp.isVarbindError(varbinds[i])) {
                                node.error(snmp.varbindError(varbinds[i]), msg);
                            }
                        }
                    }
                    closeSession(sessionid);
                });
            }
            else {
                node.warn("No varbinds to set");
            }
        });

    }
    RED.nodes.registerType("snmp set", SnmpSNode);


    function SnmpTNode(n) {
        RED.nodes.createNode(this, n);
        this.community = n.community;
        this.host = n.host;
        this.version = n.version;
        this.username = n.username;
        this.auth = n.auth;
        this.authprot = n.authprot;
        this.privprot = n.privprot;
        this.authkey = n.authkey;
        this.privkey = n.privkey;
        this.oids = n.oids.replace(/\s/g, "");
        this.timeout = Number(n.timeout || 5) * 1000;
        var node = this;
        var maxRepetitions = 20;

        function sortInt(a, b) {
            if (a > b) { return 1; }
            else if (b > a) { return -1; }
            else { return 0; }
        }

        this.on("input", function (msg) {
            var host = node.host || msg.host;
            var version = node.version;
            var community = node.community || msg.community;
            var username = node.username || msg.username;
            var auth = node.auth;
            var authprot = node.authprot;
            var privprot = node.privprot;
            var authkey = node.authkey || msg.authkey;
            var privkey = node.privkey || msg.privkey;
            var oids = node.oids || msg.oid;
            var sessionid = Date.now();
            var data = {};
            data.community = community;
            data.name = username;
            data.auth = auth;
            data.authprot = authprot;
            data.privprot = privprot;
            data.authkey = authkey;
            data.privkey = privkey;
            data.sessionid = sessionid;
            var options = {};
            options.version = version;
            options.timeout = node.timeout;
            node.log({options});
            if (oids) {
                msg.oid = oids;
                openSession(host, data, options).table(oids, maxRepetitions, function (error, table) {
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
                    closeSession(sessionid);
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
        this.version = n.version;
        this.username = n.username;
        this.auth = n.auth;
        this.authprot = n.authprot;
        this.privprot = n.privprot;
        this.authkey = n.authkey;
        this.privkey = n.privkey;
        this.oids = n.oids.replace(/\s/g, "");
        this.timeout = Number(n.timeout || 5) * 1000;
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
            var version = node.version;
            var community = node.community || msg.community;
            var username = node.username || msg.username;
            var auth = node.auth;
            var authprot = node.authprot;
            var privprot = node.privprot;
            var authkey = node.authkey || msg.authkey;
            var privkey = node.privkey || msg.privkey;
            var oids = node.oids || msg.oid;
            var sessionid = Date.now();
            var data = {};
            data.community = community;
            data.name = username;
            data.auth = auth;
            data.authprot = authprot;
            data.privprot = privprot;
            data.authkey = authkey;
            data.privkey = privkey;
            data.sessionid = sessionid;
            var options = {};
            options.version = version;
            options.timeout = node.timeout;
            if (oids) {
                msg.oid = oids;
                openSession(host, data, options).subtree(msg.oid, maxRepetitions, feedCb, function (error) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
                        // Clone the array
                        msg.payload = response.slice(0);
                        node.send(msg);
                        //Clears response
                        response.length = 0;
                    }
                    closeSession(sessionid);
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
        this.version = n.version;
        this.username = n.username;
        this.auth = n.auth;
        this.authprot = n.authprot;
        this.privprot = n.privprot;
        this.authkey = n.authkey;
        this.privkey = n.privkey;
        this.oids = n.oids.replace(/\s/g, "");
        this.timeout = Number(n.timeout || 5) * 1000;
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
            var host = node.host || msg.host;
            var version = node.version;
            var community = node.community || msg.community;
            var username = node.username || msg.username;
            var auth = node.auth;
            var authprot = node.authprot;
            var privprot = node.privprot;
            var authkey = node.authkey || msg.authkey;
            var privkey = node.privkey || msg.privkey;
            var oids = node.oids || msg.oid;
            var sessionid = Date.now();
            var data = {};
            data.community = community;
            data.name = username;
            data.auth = auth;
            data.authprot = authprot;
            data.privprot = privprot;
            data.authkey = authkey;
            data.privkey = privkey;
            data.sessionid = sessionid;
            var options = {};
            options.version = version;
            options.timeout = node.timeout;
            if (oids) {
                msg.oid = oids;
                openSession(host, data, options).walk(msg.oid, maxRepetitions, feedCb, function (error) {
                    if (error) {
                        node.error(error.toString(), msg);
                    }
                    else {
                        // Clone the array
                        msg.payload = response.slice(0);
                        node.send(msg);
                        //Clears response
                        response.length = 0;
                    }
                    closeSession(sessionid);
                });
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp walker", SnmpWalkerNode);
};
