/**
 * Copyright 2013,2014 IBM Corp.
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
    var http = require("follow-redirects").http;
    var https = require("follow-redirects").https;
    var urllib = require("url");
    var express = require("express");
    var getBody = require('raw-body');
    var mustache = require("mustache");
    var querystring = require("querystring");
    var cors = require('cors');
    
    //var bodyParser = require('body-parser');
    //var jsonParser = bodyParser.json();
    //var urlencParser = bodyParser.urlencoded();
    var onHeaders = require('on-headers');

    function rawBodyParser(req, res, next) {
        if (req._body) { return next(); }
        req.body = "";
        req._body = true;
        getBody(req, {
            limit: '1mb',
            length: req.headers['content-length'],
            encoding: 'utf8'
        }, function (err, buf) {
            if (err) { return next(err); }
            req.body = buf;
            next();
        });
    }


    function MoniIn(n) {
        RED.nodes.createNode(this,n);
        if (RED.settings.httpNodeRoot !== false) {
	     var root = RED.settings.httpNodeRoot;
            if (root.slice(-1) != "/") {
                    root = root+"/";
            }
            root += this.id;
            

            this.url = root;
            this.method = "get";
            

            var node = this;

            this.errorHandler = function(err,req,res,next) {
                node.warn(err);
                res.send(500);
            };

            this.callback = function(req,res) {
                if (node.method.match(/(^post$|^delete$|^put$|^options$)/)) {
                    node.send({req:req,res:res,payload:req.body.userinput});
                } else if (node.method == "get") {
                    node.send({req:req,res:res,payload:req.query.userinput,longitude:req.query.longitude,latitude:req.query.latitude});
                } else {
                    node.send({req:req,res:res});
                }
            };

            var corsHandler = function(req,res,next) { next(); }

            if (RED.settings.httpNodeCors) {
                corsHandler = cors(RED.settings.httpNodeCors);
                RED.httpNode.options(this.url,corsHandler);
            }

            var httpMiddleware = function(req,res,next) { next(); }

            if (RED.settings.httpNodeMiddleware) {
                if (typeof RED.settings.httpNodeMiddleware === "function") {
                    httpMiddleware = RED.settings.httpNodeMiddleware;
                }
            }

            var metricsHandler = function(req,res,next) { next(); }

            if (this.metric()) {
                metricsHandler = function(req, res, next) {
                    var startAt = process.hrtime();
                    onHeaders(res, function() {
                        if (res._msgId) {
                            var diff = process.hrtime(startAt);
                            var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                            var metricResponseTime = ms.toFixed(3);
                            var metricContentLength = res._headers["content-length"];
                            //assuming that _id has been set for res._metrics in HttpOut node!
                            node.metric("response.time.millis", {_id:res._msgId} , metricResponseTime);
                            node.metric("response.content-length.bytes", {_id:res._msgId} , metricContentLength);
                        }
                    });
                    next();
                };
            }

            if (this.method == "get") {
                RED.httpNode.get(this.url,httpMiddleware,corsHandler,metricsHandler,this.callback,this.errorHandler);
		  
            } else if (this.method == "post") {
                RED.httpNode.post(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            } else if (this.method == "put") {
                RED.httpNode.put(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            } else if (this.method == "delete") {
                RED.httpNode.delete(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            }

            this.on("close",function() {
                var routes = RED.httpNode.routes[this.method];
                for (var i = 0; i<routes.length; i++) {
                    if (routes[i].path == this.url) {
                        routes.splice(i,1);
                        //break;
                    }
                }
                if (RED.settings.httpNodeCors) {
                    var routes = RED.httpNode.routes['options'];
                    if (routes) {
                        for (var j = 0; j<routes.length; j++) {
                            if (routes[j].path == this.url) {
                                routes.splice(j,1);
                                //break;
                            }
                        }
                    }
                }
            });
        } else {
            this.warn("Cannot create moni-in node when httpNodeRoot set to false");
        }
    }
    RED.nodes.registerType("Moni.ai in",MoniIn);


    function MoniOut(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.on("input",function(msg) {
            if (msg.res) {
                if (msg.headers) {
                    msg.res.set(msg.headers);
                }
                var statusCode = msg.statusCode || 200;
		  if (msg.link == null) msg.link = "";
		  if (msg.picture == null) msg.picture = "";
		  var outputmessage = n.trigger;
		  if (outputmessage == "") outputmessage = msg.payload;

		  msg.payload = "<xmlstruct><output>" + outputmessage + "</output><link>" + msg.link + "</link><picture>" + msg.picture + "</picture></xmlstruct>";
                if (typeof msg.payload == "object" && !Buffer.isBuffer(msg.payload)) {
                    msg.res.jsonp(statusCode,msg.payload);
                } else {
                    if (msg.res.get('content-length') == null) {
                        var len;
                        if (msg.payload == null) {
                            len = 0;
                        } else if (Buffer.isBuffer(msg.payload)) {
                            len = msg.payload.length;
                        } else if (typeof msg.payload == "number") {
                            len = Buffer.byteLength(""+msg.payload);
                        } else {
                            len = Buffer.byteLength(msg.payload);
                        }
                        msg.res.set('content-length', len);
                    }

                    msg.res._msgId = msg._id;
		      msg.res.send(statusCode,msg.payload);
                }
            } else {
                node.warn("No response object");
            }
        });
    }
    RED.nodes.registerType("Moni.ai out",MoniOut);


    function MoniRequest(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.on("input",function(msg) {
            if (msg.res) {
                if (msg.headers) {
                    msg.res.set(msg.headers);
                }
                var statusCode = msg.statusCode || 200;
		  var outputmessage = n.trigger;
		  if (outputmessage == "") outputmessage = msg.payload;
		  var root = msg.req.protocol + '://' + msg.req.get('host') + RED.settings.httpNodeRoot + "/" + this.id;
		  if (msg.link == null) msg.link = "";
		  if (msg.picture == null) msg.picture = "";
		  msg.payload = "<xmlstruct><output>" + outputmessage + "</output><targeturl>" + root + "</targeturl><link>" + msg.link + "</link><picture>" + msg.picture + "</picture></xmlstruct>";
                if (typeof msg.payload == "object" && !Buffer.isBuffer(msg.payload)) {
                    msg.res.jsonp(statusCode,msg.payload);
                } else {
                    if (msg.res.get('content-length') == null) {
                        var len;
                        if (msg.payload == null) {
                            len = 0;
                        } else if (Buffer.isBuffer(msg.payload)) {
                            len = msg.payload.length;
                        } else if (typeof msg.payload == "number") {
                            len = Buffer.byteLength(""+msg.payload);
                        } else {
                            len = Buffer.byteLength(msg.payload);
                        }
                        msg.res.set('content-length', len);
                    }

                    msg.res._msgId = msg._id;
		      msg.res.send(statusCode,msg.payload);
                }
            } else {
                node.warn("No response object");
            }
        });

        if (RED.settings.httpNodeRoot !== false) {
	     var root = RED.settings.httpNodeRoot;
            if (root.slice(-1) != "/") {
                    root = root+"/";
            }
            root += this.id;
            

            this.url = root;
            this.method = "get";
            

            var node = this;

            this.errorHandler = function(err,req,res,next) {
                node.warn(err);
                res.send(500);
            };

            this.callback = function(req,res) {
                if (node.method.match(/(^post$|^delete$|^put$|^options$)/)) {
                    node.send({req:req,res:res,payload:req.body.userinput});
                } else if (node.method == "get") {
                    node.send({req:req,res:res,payload:req.query.userinput,longitude:req.query.longitude,latitude:req.query.latitude});
                } else {
                    node.send({req:req,res:res});
                }
            };

            var corsHandler = function(req,res,next) { next(); }

            if (RED.settings.httpNodeCors) {
                corsHandler = cors(RED.settings.httpNodeCors);
                RED.httpNode.options(this.url,corsHandler);
            }

            var httpMiddleware = function(req,res,next) { next(); }

            if (RED.settings.httpNodeMiddleware) {
                if (typeof RED.settings.httpNodeMiddleware === "function") {
                    httpMiddleware = RED.settings.httpNodeMiddleware;
                }
            }

            var metricsHandler = function(req,res,next) { next(); }

            if (this.metric()) {
                metricsHandler = function(req, res, next) {
                    var startAt = process.hrtime();
                    onHeaders(res, function() {
                        if (res._msgId) {
                            var diff = process.hrtime(startAt);
                            var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                            var metricResponseTime = ms.toFixed(3);
                            var metricContentLength = res._headers["content-length"];
                            //assuming that _id has been set for res._metrics in HttpOut node!
                            node.metric("response.time.millis", {_id:res._msgId} , metricResponseTime);
                            node.metric("response.content-length.bytes", {_id:res._msgId} , metricContentLength);
                        }
                    });
                    next();
                };
            }

            if (this.method == "get") {
                RED.httpNode.get(this.url,httpMiddleware,corsHandler,metricsHandler,this.callback,this.errorHandler);
		  
            } else if (this.method == "post") {
                RED.httpNode.post(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            } else if (this.method == "put") {
                RED.httpNode.put(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            } else if (this.method == "delete") {
                RED.httpNode.delete(this.url,httpMiddleware,corsHandler,metricsHandler,jsonParser,urlencParser,rawBodyParser,this.callback,this.errorHandler);
            }

            this.on("close",function() {
                var routes = RED.httpNode.routes[this.method];
                for (var i = 0; i<routes.length; i++) {
                    if (routes[i].path == this.url) {
                        routes.splice(i,1);
                        //break;
                    }
                }
                if (RED.settings.httpNodeCors) {
                    var routes = RED.httpNode.routes['options'];
                    if (routes) {
                        for (var j = 0; j<routes.length; j++) {
                            if (routes[j].path == this.url) {
                                routes.splice(j,1);
                                //break;
                            }
                        }
                    }
                }
            });
        } else {
            this.warn("Cannot create moni-ask node when httpNodeRoot set to false");
        }
    }

    RED.nodes.registerType("Moni.ai ask",MoniRequest);


}
