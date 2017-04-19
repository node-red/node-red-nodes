
module.exports = function(RED) {
    "use strict";
    var mongo = require('mongodb');
    var ObjectID = require('mongodb').ObjectID;
    var MongoClient = mongo.MongoClient;

    function MongoNode(n) {
        RED.nodes.createNode(this,n);
        this.hostname = n.hostname;
        this.port = n.port;
        this.db = n.db;
        this.name = n.name;

        var url = "mongodb://";
        if (this.credentials && this.credentials.user && this.credentials.password) {
            url += this.credentials.user+":"+this.credentials.password+"@";
        }
        url += this.hostname+":"+this.port+"/"+this.db;

        this.url = url;
    }

    RED.nodes.registerType("mongodb",MongoNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

    function ensureValidSelectorObject(selector) {
        if (selector != null && (typeof selector != 'object' || Buffer.isBuffer(selector))) {
            return {};
        }
        return selector;
    }

    function MongoOutNode(n) {
        RED.nodes.createNode(this,n);
        this.collection = n.collection;
        this.mongodb = n.mongodb;
        this.payonly = n.payonly || false;
        this.upsert = n.upsert || false;
        this.multi = n.multi || false;
        this.operation = n.operation;
        this.mongoConfig = RED.nodes.getNode(this.mongodb);
        this.status({fill:"grey",shape:"ring",text:RED._("mongodbstatus.connecting")});
        var node = this;
        var noerror = true;

        var connectToDB = function() {
            MongoClient.connect(node.mongoConfig.url, function(err, db) {
                if (err) {
                    node.status({fill:"red",shape:"ring",text:RED._("mongodb.status.error")});
                    if (noerror) { node.error(err); }
                    noerror = false;
                    node.tout = setTimeout(connectToDB, 10000);
                }
                else {
                    node.status({fill:"green",shape:"dot",text:RED._("mongodb.status.connected")});
                    node.clientDb = db;
                    noerror = true;
                    var coll;
                    if (node.collection) {
                        coll = db.collection(node.collection);
                    }
                    node.on("input",function(msg) {
                        if (!node.collection) {
                            if (msg.collection) {
                                coll = db.collection(msg.collection);
                            }
                            else {
                                node.error(RED._("mongodb.errors.nocollection"),msg);
                                return;
                            }
                        }
                        delete msg._topic;
                        delete msg.collection;
                        if (node.operation === "store") {
                            if (node.payonly) {
                                if (typeof msg.payload !== "object") {
                                    msg.payload = {"payload": msg.payload};
                                }
                                if (msg.hasOwnProperty("_id") && !msg.payload.hasOwnProperty("_id")) {
                                    msg.payload._id = msg._id;
                                }
                                coll.save(msg.payload,function(err, item) {
                                    if (err) {
                                        node.error(err,msg);
                                    }
                                });
                            }
                            else {
                                coll.save(msg,function(err, item) {
                                    if (err) {
                                        node.error(err,msg);
                                    }
                                });
                            }
                        }
                        else if (node.operation === "insert") {
                            if (node.payonly) {
                                if (typeof msg.payload !== "object") {
                                    msg.payload = {"payload": msg.payload};
                                }
                                if (msg.hasOwnProperty("_id") && !msg.payload.hasOwnProperty("_id")) {
                                    msg.payload._id = msg._id;
                                }
                                coll.insert(msg.payload, function(err, item) {
                                    if (err) {
                                        node.error(err,msg);
                                    }
                                });
                            }
                            else {
                                coll.insert(msg, function(err,item) {
                                    if (err) {
                                        node.error(err,msg);
                                    }
                                });
                            }
                        }
                        else if (node.operation === "update") {
                            if (typeof msg.payload !== "object") {
                                msg.payload = {"payload": msg.payload};
                            }
                            var query = msg.query || {};
                            var payload = msg.payload || {};
                            var options = {
                                upsert: node.upsert,
                                multi: node.multi
                            };
                            if (ObjectID.isValid(msg.query._id)) {
                                msg.query._id = new ObjectID(msg.query._id);
                            }
                            coll.update(query, payload, options, function(err, item) {
                                if (err) {
                                    node.error(err,msg);
                                }
                            });
                        }
                        else if (node.operation === "delete") {
                            coll.remove(msg.payload, function(err, items) {
                                if (err) {
                                    node.error(err,msg);
                                }
                            });
                        }
                    });
                }
            });
        }

        if (node.mongoConfig) { connectToDB(); }
        else { node.error(RED._("mongodb.errors.missingconfig")); }

        node.on("close", function() {
            node.status({});
            if (node.tout) { clearTimeout(node.tout); }
            if (node.clientDb) { node.clientDb.close(); }
        });
    }
    RED.nodes.registerType("mongodb out",MongoOutNode);


    function MongoInNode(n) {
        RED.nodes.createNode(this,n);
        this.collection = n.collection;
        this.mongodb = n.mongodb;
        this.operation = n.operation || "find";
        this.mongoConfig = RED.nodes.getNode(this.mongodb);
        this.status({fill:"grey",shape:"ring",text:RED._("mongodb.status.connecting")});
        var node = this;
        var noerror = true;

        var connectToDB = function() {
            MongoClient.connect(node.mongoConfig.url, function(err,db) {
                if (err) {
                    node.status({fill:"red",shape:"ring",text:RED._("mongodb.status.error")});
                    if (noerror) { node.error(err); }
                    noerror = false;
                    node.tout = setTimeout(connectToDB, 10000);
                }
                else {
                    node.status({fill:"green",shape:"dot",text:RED._("mongodb.status.connected")});
                    node.clientDb = db;
                    noerror = true;
                    var coll;
                    node.on("input", function(msg) {
                        if (!node.collection) {
                            if (msg.collection) {
                                coll = db.collection(msg.collection);
                            }
                            else {
                                node.error(RED._("mongodb.errors.nocollection"));
                                return;
                            }
                        }
                        else {
                            coll = db.collection(node.collection);
                        }
                        var selector;
                        if (node.operation === "find") {
                            msg.projection = msg.projection || {};
                            selector = ensureValidSelectorObject(msg.payload);
                            var limit = msg.limit;
                            if (typeof limit === "string" && !isNaN(limit)) {
                                limit = Number(limit);
                            } else if (typeof limit === "undefined") {
                                limit = 0;
                            }
                            var skip = msg.skip;
                            if (typeof skip === "string" && !isNaN(skip)) {
                                skip = Number(skip);
                            } else if (typeof skip === "undefined") {
                                skip = 0;
                            }

                            coll.find(selector,msg.projection).sort(msg.sort).limit(limit).skip(skip).toArray(function(err, items) {
                                if (err) {
                                    node.error(err);
                                }
                                else {
                                    msg.payload = items;
                                    delete msg.projection;
                                    delete msg.sort;
                                    delete msg.limit;
                                    delete msg.skip;
                                    node.send(msg);
                                }
                            });
                        }
                        else if (node.operation === "count") {
                            selector = ensureValidSelectorObject(msg.payload);
                            coll.count(selector, function(err, count) {
                                if (err) {
                                    node.error(err);
                                }
                                else {
                                    msg.payload = count;
                                    node.send(msg);
                                }
                            });
                        }
                        else if (node.operation === "aggregate") {
                            msg.payload = (Array.isArray(msg.payload)) ? msg.payload : [];
                            coll.aggregate(msg.payload, function(err, result) {
                                if (err) {
                                    node.error(err);
                                }
                                else {
                                    msg.payload = result;
                                    node.send(msg);
                                }
                            });
                        }
                    });
                }
            });
        }

        if (node.mongoConfig) { connectToDB(); }
        else { node.error(RED._("mongodb.errors.missingconfig")); }

        node.on("close", function() {
            node.status({});
            if (node.tout) { clearTimeout(node.tout); }
            if (node.clientDb) { node.clientDb.close(); }
        });
    }
    RED.nodes.registerType("mongodb in",MongoInNode);
}
