
module.exports = function (RED) {
    "use strict";
    const SNMP = require("net-snmp");
    const sessions = {};
    function generateUUID() {
        let d = Date.now();
        let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || (Date.now() * Math.random() * 100000);//Time in microseconds since load
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16;//random number between 0 and 16
            if (d > 0) {//Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
    function openSession(sessionid, host, user, options) {
        // SNMPv3 call
        if (options.version === SNMP.Version3) {
            sessions[sessionid] = SNMP.createV3Session(host, user, options);
        }
        // SNMPv1 or SNMPv2c call
        else {
            sessions[sessionid] = SNMP.createSession(host, user.community, options);
        }
        return sessions[sessionid];
    }

    // Any session needs to be closed after completion
    function closeSession(sessionid) {
        try {
            sessions[sessionid].removeAllListeners();
        } catch (e) { }
        try {
            sessions[sessionid].close();
        } catch (e) { }
        delete sessions[sessionid];
    }

    function initSnmpNode(node, config) {
        node.community = config.community;
        node.host = config.host;
        node.version = config.version;
        node.auth = config.auth;
        node.authprot = config.authprot;
        node.privprot = config.privprot;
        if (node.credentials) {
            node.username = node.credentials.username;
            node.authkey = node.credentials.authkey;
            node.privkey = node.credentials.privkey;
        }
        node.timeout = Number(config.timeout || 5) * 1000;
    }

    function prepareSnmpOptions(node, msg) {
        let host = node.host || msg.host;
        const sessionid = generateUUID();
        const user = {}
        const options = {};
        const compat = { "v1": "1", "v2": "2c", "v2c": "2c", "v3": "3" };
        if(compat[node.version]) {
            node.version = compat[node.version];
        } else if(["1","2c","3"].indexOf(node.version) < 0) {
            node.version = "1";
        }
        options.version = node.version;
        if (node.version === "1") {
            options.version = SNMP.Version1;
            user.community = node.community || msg.community;
        } else if (node.version === "2c") {
            options.version = SNMP.Version2c;
            user.community = node.community || msg.community;
        } else if (node.version === "3") {
            user.name = node.username || msg.username || "";
            user.level = SNMP.SecurityLevel.noAuthNoPriv;
            user.authProtocol = SNMP.AuthProtocols.none;
            user.authKey = "";
            user.privProtocol = SNMP.PrivProtocols.none;
            user.privKey = "";
            options.version = SNMP.Version3;
            if (node.auth === "authNoPriv" || node.auth === "authPriv") {
                user.level = SNMP.SecurityLevel.authNoPriv;
                user.authProtocol = (node.authprot === "SHA") ? SNMP.AuthProtocols.sha : SNMP.AuthProtocols.md5;
                user.authKey = node.authkey || msg.authkey || "";
                if (node.auth === "authPriv") {
                    user.level = SNMP.SecurityLevel.authPriv;
                    if (node.privprot === "DES" || node.privprot === "AES") {
                        user.privProtocol = (node.privprot === "AES") ? SNMP.PrivProtocols.aes : SNMP.PrivProtocols.des;
                        user.privKey = node.privkey || msg.privkey || "";
                    }
                }
            }
        }

        options.timeout = node.timeout;
        options.debug = msg.debug || undefined;
        options.port = options.port || 161;
        options.retries = options.retries || 1;

        if (msg.engineID) {
            options.engineID = msg.engineID;//The engineID used for SNMPv3 communications, given as a hex string - defaults to a system-generated engineID containing elements of random
        }
        if (msg.backoff) {
            options.backoff = msg.backoff;//The factor by which to increase the timeout for every retry, defaults to 1 for no increase
        }
        if (msg.backwardsGetNexts) {
            options.backwardsGetNexts = msg.backwardsGetNexts;//boolean to allow GetNext operations to retrieve lexicographically preceding OIDs
        }
        if (msg.idBitsSize === 16 || msg.idBitsSize === 32) {
            options.idBitsSize = msg.idBitsSize;//Either 16 or 32, defaults to 32. Used to reduce the size of the generated id for compatibility with some older devices.
        }
        const ipv = parseIP(host);
        if (ipv.version === 4) {
            host = ipv.ip;
            options.port = ipv.port || options.port;
            options.transport = 'udp4';
        } else if (ipv.version === 6) {
            host = ipv.ip;
            options.port = ipv.port || options.port;
            options.transport = 'udp6';
        } else {
            //probably a host name
            if (host.indexOf(":") > 0) {
                host = host.split(":")[0];
                options.port = host.split(":")[1];
            }
        }
        return {
            host: host,
            sessionid: sessionid,
            user: user,
            options: options,
        }
    }
    function parseIP(ip) {
        const IPV4_PAT = /^(\d+)\.(\d+)\.(\d+)\.(\d+)(?::(\d+)){0,1}$/g;
        const IPV6_DOUBLE_COL_PAT = /^\[{0,1}([0-9a-f:]*)::([0-9a-f:]*)(?:\]:(\d+)){0,1}$/g;
        const ipv4Matcher = IPV4_PAT.exec(ip);
        let hex = "";
        let port;
        let ipOnly = [];
        try {

            if (ipv4Matcher && ipv4Matcher.length) {
                for (let i = 1; i <= 4; i++) {
                    ipOnly.push(ipv4Matcher[i]);
                    hex += toHex4(ipv4Matcher[i]);
                }
                if (ipv4Matcher[5]) {
                    port = parseInt(ipv4Matcher[5]);
                }
                return { ip: ipOnly.join("."), hex, port, version: 4 };
            }

            // IPV6 Must be colons format (a:b:c:d:e:A.B.C.D not currently supported)
            let ipv6Pattern = "^\\[{0,1}";
            for (let i = 1; i <= 7; i++) {
                ipv6Pattern += "([0-9a-f]+):";
            }
            ipv6Pattern += "([0-9a-f]+)(?:\\]:(\\d+)){0,1}$";
            const IPV6_PAT = new RegExp(ipv6Pattern);


            //  IPV6, double colon
            const ipv6DoubleColonMatcher = IPV6_DOUBLE_COL_PAT.exec(ip);
            if (ipv6DoubleColonMatcher && ipv6DoubleColonMatcher.length) {
                let p1 = ipv6DoubleColonMatcher[1];
                if (!p1) {
                    p1 = "0";
                }
                let p2 = ipv6DoubleColonMatcher[2];
                if (!p2) {
                    p2 = "0";
                }
                p1 = p1.padStart(4, "0");
                p2 = p2.padStart(4, "0");
                ip = p1 + getZeros(8 - numCount(p1) - numCount(p2)) + p2;
                if (ipv6DoubleColonMatcher[3]) {
                    ip = "[" + ip + "]:" + ipv6DoubleColonMatcher[3];
                }
            }

            //  IPV6
            const ipv6Matcher = IPV6_PAT.exec(ip);
            if (ipv6Matcher && ipv6Matcher.length) {
                for (let i = 1; i <= 8; i++) {
                    const p = toHex6(ipv6Matcher[i]).padStart(4, "0");
                    ipOnly.push(p);
                    hex += p;
                }
                if (ipv6Matcher[9]) {
                    port = parseInt(ipv6Matcher[9]);
                }
                return { ip: ipOnly.join(":"), hex, port, version: 6 };
            }

            throw new Error("Unknown address: " + ip);
        } catch (error) {
            return { ip, hex, port, version: null, error: error };
        }

        function numCount(/** @type {string} */s) {
            return s.split(":").length;
        }
        function getZeros(/** @type {number} */ count) {
            const sb = [":"];
            while (count > 0) {
                sb.push("0000:");
                count--;
            }
            return sb.join("");
        }
        function toHex4(/** @type {string} */ s) {
            const val = parseInt(s);
            if (val < 0 || val > 255) {
                throw new Error("Invalid value : " + s);
            }
            return val.toString(16).padStart(2, "0");
        }
        function toHex6(/** @type {string} */ s) {
            const val = parseInt(s, 16);
            if (val < 0 || val > 65536) {
                throw new Error("Invalid hex value : " + s);
            }
            return s;
        }
    }
    function SnmpNode(n) {
        const node = this;
        RED.nodes.createNode(node, n);
        initSnmpNode(node, n);
        node.oids = n.oids ? n.oids.replace(/\s/g, "") : "";

        node.on("input", function (msg) {
            const oids = node.oids || msg.oid;
            const { host, sessionid, user, options } = prepareSnmpOptions(node, msg);
            if (oids) {
                let sess = openSession(sessionid, host, user, options);
                sess.on("error", function (err) {
                    node.error(err, msg);
                })
                sess.get(oids.split(","), function (error, varbinds) {
                    if (error) {
                        node.error(error.toString(), msg);
                    } else {
                        for (let i = 0; i < varbinds.length; i++) {
                            let vb = varbinds[i];
                            if (SNMP.isVarbindError(vb)) {
                                node.error(SNMP.varbindError(vb), msg);
                                vb._error = SNMP.varbindError(vb); //add _error to msg so users can determine the varbind is not valid
                            }
                            // else {
                            //     if (vb.type == 4) { vb.value = vb.value.toString(); }
                            // }
                            vb.tstr = SNMP.ObjectType[vb.type];
                        }
                        msg.payload = varbinds;
                        msg.oid = oids;
                        node.send(msg);
                    }
                    closeSession(sessionid); // Needed to close the session else a bad or good read could affect future readings
                });
            } else {
                node.warn("No oid(s) to search for");
            }
        });
    }
    RED.nodes.registerType("snmp", SnmpNode, {
        credentials: {
            username: { type: "text" },
            authkey: { type: "password" },
            privkey: { type: "password" }
        }
    });

    function SnmpSNode(n) {
        const node = this;
        RED.nodes.createNode(node, n);
        initSnmpNode(node, n);
        node.varbinds = n.varbinds;
        if (node.varbinds && node.varbinds.trim().length === 0) { delete node.varbinds; }
        node.on("input", function (msg) {
            const { host, sessionid, user, options } = prepareSnmpOptions(node, msg);
            const varbinds = (node.varbinds) ? JSON.parse(node.varbinds) : msg.varbinds;
            if (varbinds) {
                for (let i = 0; i < varbinds.length; i++) {
                    varbinds[i].type = SNMP.ObjectType[varbinds[i].type];
                }
                let sess = openSession(sessionid, host, user, options);
                sess.on("error", function (err) {
                    node.error(err, msg);
                })
                sess.set(varbinds, function (error, varbinds) {
                    if (error) {
                        node.error(error.toString(), msg);
                    } else {
                        for (let i = 0; i < varbinds.length; i++) {
                            // for version 2c we must check each OID for an error condition
                            if (SNMP.isVarbindError(varbinds[i])) {
                                node.error(SNMP.varbindError(varbinds[i]), msg);
                            }
                        }
                    }
                    closeSession(sessionid);
                });
            } else {
                node.warn("No varbinds to set");
            }
        });

    }
    RED.nodes.registerType("snmp set", SnmpSNode, {
        credentials: {
            username: { type: "text" },
            authkey: { type: "password" },
            privkey: { type: "password" }
        }
    });


    function SnmpTNode(n) {
        const node = this;
        RED.nodes.createNode(node, n);
        initSnmpNode(node, n);
        node.oids = n.oids ? n.oids.replace(/\s/g, "") : ""
        const maxRepetitions = 20;

        function sortInt(a, b) {
            if (a > b) { return 1; }
            else if (b > a) { return -1; } else { return 0; }
        }

        node.on("input", function (msg) {
            const oids = node.oids || msg.oid;
            const { host, sessionid, user, options } = prepareSnmpOptions(node, msg);
            if (oids) {
                msg.oid = oids;
                let sess = openSession(sessionid, host, user, options);
                sess.on("error", function (err) {
                    node.error(err, msg);
                })
                sess.table(oids, maxRepetitions, function (error, table) {
                    if (error) {
                        node.error(error.toString(), msg);
                    } else {
                        const indexes = [];
                        for (let index in table) {
                            if (table.hasOwnProperty(index)) {
                                indexes.push(parseInt(index));
                            }
                        }
                        indexes.sort(sortInt);
                        for (let i = 0; i < indexes.length; i++) {
                            const columns = [];
                            for (let column in table[indexes[i]]) {
                                if (table[indexes[i]].hasOwnProperty(column)) {
                                    columns.push(parseInt(column));
                                }
                            }
                            columns.sort(sortInt);
                        }
                        msg.payload = table;
                        node.send(msg);
                    }
                    closeSession(sessionid);
                });
            } else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp table", SnmpTNode, {
        credentials: {
            username: { type: "text" },
            authkey: { type: "password" },
            privkey: { type: "password" }
        }
    });


    function SnmpSubtreeNode(n) {
        const node = this;
        RED.nodes.createNode(node, n);
        initSnmpNode(node, n);
        node.oids = n.oids ? n.oids.replace(/\s/g, "") : ""
        const maxRepetitions = 20;

        node.on("input", function (msg) {
            const oids = node.oids || msg.oid;
            const { host, sessionid, user, options } = prepareSnmpOptions(node, msg);
            const response = [];
            function feedCb(varbinds) {
                for (let i = 0; i < varbinds.length; i++) {
                    if (SNMP.isVarbindError(varbinds[i])) {
                        node.error(SNMP.varbindError(varbinds[i]), msg);
                    } else {
                        response.push({ oid: varbinds[i].oid, value: varbinds[i].value });
                    }
                }
            }
            if (oids) {
                msg.oid = oids;
                let sess = openSession(sessionid, host, user, options);
                sess.on("error", function (err) {
                    node.error(err, msg);
                })
                sess.subtree(msg.oid, maxRepetitions, feedCb, function (error) {
                    if (error) {
                        node.error(error.toString(), msg);
                    } else {
                        msg.payload = response;
                        node.send(msg);
                    }
                    closeSession(sessionid);
                });
            } else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp subtree", SnmpSubtreeNode, {
        credentials: {
            username: { type: "text" },
            authkey: { type: "password" },
            privkey: { type: "password" }
        }
    });

    function SnmpWalkerNode(n) {
        const node = this;
        RED.nodes.createNode(node, n);
        initSnmpNode(node, n);
        node.oids = n.oids ? n.oids.replace(/\s/g, "") : ""
        const maxRepetitions = 20;

        node.on("input", function (msg) {
            const oids = node.oids || msg.oid;
            const { host, sessionid, user, options } = prepareSnmpOptions(node, msg);
            const response = [];
            function feedCb(varbinds) {
                for (let i = 0; i < varbinds.length; i++) {
                    if (SNMP.isVarbindError(varbinds[i])) {
                        node.error(SNMP.varbindError(varbinds[i]), msg);
                    } else {
                        response.push({ oid: varbinds[i].oid, value: varbinds[i].value });
                    }
                }
            }
            if (oids) {
                msg.oid = oids;
                let sess = openSession(sessionid, host, user, options);
                sess.on("error", function (err) {
                    node.error(err, msg);
                })
                sess.walk(msg.oid, maxRepetitions, feedCb, function (error) {
                    if (error) {
                        node.error(error.toString(), msg);
                    } else {
                        msg.payload = response;
                        node.send(msg);
                    }
                    closeSession(sessionid);
                });
            } else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp walker", SnmpWalkerNode, {
        credentials: {
            username: { type: "text" },
            authkey: { type: "password" },
            privkey: { type: "password" }
        }
    });
};
