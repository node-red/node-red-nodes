/**
 * Copyright 2014 IBM Corp.
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

module.exports = function(RED) {
    "use strict";
    var snmp = require ("net-snmp");

    function SnmpNode(n) {
        RED.nodes.createNode(this,n);
        this.community = n.community || "public";
        this.host = n.host || "127.0.0.1";
        this.version = (n.version === "2c") ? snmp.Version2c : snmp.Version1;
        this.oids = n.oids.replace(/\s/g,"");
        this.session = snmp.createSession (this.host, this.community, {version: this.version});
        var node = this;

        this.on("input",function(msg) {
            var oids = node.oids || msg.oid;
            if (oids) {
                node.session.get(oids.split(","), function(error, varbinds) {
                    if (error) {
                        node.error(error.toString());
                    } else {
                        for (var i = 0; i < varbinds.length; i++) {
                            if (snmp.isVarbindError (varbinds[i])) {
                                node.error(snmp.varbindError (varbinds[i]));
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
        this.session = snmp.createSession (this.host, this.community, {version: this.version});
        var node = this;
        var maxRepetitions = 20;

        function sortInt (a, b) {
            if (a > b) { return 1; }
            else if (b > a) { return -1; }
            else { return 0; }
        }

        function responseCb (error, table) {
            if (error) {
                console.error (error.toString ());
            } else {
                var indexes = [];
                for (var index in table) {
                    if (table.hasOwnProperty(index)) {
                        indexes.push (parseInt (index));
                    }
                }
                indexes.sort (sortInt);
                for (var i = 0; i < indexes.length; i++) {
                    var columns = [];
                    for (var column in table[indexes[i]]) {
                        if (table[indexes[i]].hasOwnProperty(column)) {
                            columns.push(parseInt (column));
                        }
                    }
                    columns.sort(sortInt);
                    console.log ("row index = " + indexes[i]);
                    for (var j = 0; j < columns.length; j++) {
                        console.log ("  column " + columns[j] + " = " + table[indexes[i]][columns[j]]);
                    }
                }
                msg.payload = table;
                node.send(msg);
            }
        }
        this.on("input",function(msg) {
            var oids = node.oids || msg.oid;
            if (oids) {
                msg.oids = oids;
                node.session.table(oids, maxRepetitions, responseCb);
            }
            else {
                node.warn("No oid to search for");
            }
        });
    }
    RED.nodes.registerType("snmp table",SnmpTNode);
}
