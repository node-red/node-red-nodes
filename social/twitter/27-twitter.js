
module.exports = function(RED) {
    "use strict";
    var Ntwitter = require('twitter-ng');
    var request = require('request');
    var crypto = require('crypto');
    // var fileType = require('file-type');
    var twitterRateTimeout;
    var retry = 60000; // 60 secs backoff for now

    var localUserCache = {};
    var userObjectCache = {};
    var userSreenNameToIdCache = {};

    function TwitterCredentialsNode(n) {
        RED.nodes.createNode(this,n);
        this.screen_name = n.screen_name;
        if (this.screen_name && this.screen_name[0] === "@") {
            this.screen_name = this.screen_name.substring(1);
        }
        if (this.credentials.consumer_key &&
            this.credentials.consumer_secret &&
            this.credentials.access_token &&
            this.credentials.access_token_secret) {

            this.oauth = {
                consumer_key: this.credentials.consumer_key,
                consumer_secret: this.credentials.consumer_secret,
                token: this.credentials.access_token,
                token_secret: this.credentials.access_token_secret
            }
            this.credHash = crypto.createHash('sha1').update(
                this.credentials.consumer_key+this.credentials.consumer_secret+
                this.credentials.access_token+this.credentials.access_token_secret
            ).digest('base64');
            var self = this;
            if (localUserCache.hasOwnProperty(self.credHash)) {
                this.localIdentityPromise = Promise.resolve(localUserCache[self.credHash]);
            } else {
                this.localIdentityPromise = this.get("https://api.twitter.com/1.1/account/settings.json").then(function(body) {
                    if (body.status === 200) {
                        localUserCache[self.credHash] = body.body.screen_name;
                        self.screen_name = body.body.screen_name;
                    } else {
                        self.warn("Failed to get user profile");
                    }
                });
            }
        }
    }

    RED.nodes.registerType("twitter-credentials",TwitterCredentialsNode,{
        credentials: {
            consumer_key: { type: "password"},
            consumer_secret: { type: "password" },
            access_token: {type: "password"},
            access_token_secret: {type:"password"}
        }
    });
    TwitterCredentialsNode.prototype.get = function(url,opts) {
        var node = this;
        opts = opts || {};
        opts.tweet_mode = 'extended';
        return new Promise(function(resolve,reject) {
            request.get({
                url: url,
                oauth: node.oauth,
                json: true,
                qs: opts
            }, function(err, response,body) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        status: response.statusCode,
                        rateLimitRemaining: response.headers['x-rate-limit-remaining'],
                        rateLimitTimeout: 5000+parseInt(response.headers['x-rate-limit-reset'])*1000 - Date.now(),
                        body: body
                    });
                }
            });
        })
    }
    TwitterCredentialsNode.prototype.post = function(url,data,opts,formData) {
        var node = this;
        opts = opts || {};
        var options = {
            url: url,
            oauth: node.oauth,
            json: true,
            qs: opts,
        };
        if (data) {
            options.body = data;
        }
        if (formData) {
            options.formData = formData;
        }
        return new Promise(function(resolve,reject) {
            request.post(options, function(err, response,body) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        status: response.statusCode,
                        rateLimitRemaining: response.headers['x-rate-limit-remaining'],
                        rateLimitTimeout: 5000+parseInt(response.headers['x-rate-limit-reset'])*1000 - Date.now(),
                        body: body
                    });
                }
            });
        })
    }


    TwitterCredentialsNode.prototype.getUsers = function(users,getBy) {
        if (users.length === 0) {
            return Promise.resolve();
        }
        var params = {};
        params[getBy||"user_id"] = users;

        return this.get("https://api.twitter.com/1.1/users/lookup.json",params).then(function(result) {
            var res = result.body;
            if (res.errors) {
                throw new Error(res.errors[0].message);
            }
            res.forEach(user => {
                userObjectCache[user.id_str] = user
                userSreenNameToIdCache[user.screen_name] = user.id_str;
            });
        })
    }

    /**
     * Populate msg.location based on data found in msg.tweet.
     */
    function addLocationToTweet(msg) {
        if (msg.tweet) {
            if (msg.tweet.geo) { // if geo is set, always set location from geo
                if (msg.tweet.geo.coordinates && msg.tweet.geo.coordinates.length === 2) {
                    if (!msg.location) { msg.location = {}; }
                    // coordinates[0] is lat, coordinates[1] is lon
                    msg.location.lat = msg.tweet.geo.coordinates[0];
                    msg.location.lon = msg.tweet.geo.coordinates[1];
                    msg.location.icon = "twitter";
                }
            }
            else if (msg.tweet.coordinates) { // otherwise attempt go get it from coordinates
                if (msg.tweet.coordinates.coordinates && msg.tweet.coordinates.coordinates.length === 2) {
                    if (!msg.location) { msg.location = {}; }
                    // WARNING! coordinates[1] is lat, coordinates[0] is lon!!!
                    msg.location.lat = msg.tweet.coordinates.coordinates[1];
                    msg.location.lon = msg.tweet.coordinates.coordinates[0];
                    msg.location.icon = "twitter";
                }
            } // if none of these found then just do nothing
        } // if no msg.tweet then just do nothing
    }

    function TwitterInNode(n) {
        RED.nodes.createNode(this,n);
        this.active = true;
        this.user = n.user;
        //this.tags = n.tags.replace(/ /g,'');
        this.tags = n.tags||"";
        this.twitter = n.twitter;
        this.topic = "tweets";
        this.twitterConfig = RED.nodes.getNode(this.twitter);
        this.poll_ids = [];
        this.timeout_ids = [];

        var credentials = RED.nodes.getCredentials(this.twitter);
        this.status({});

        if (this.twitterConfig.oauth) {
            var node = this;
            if (this.user === "true") {
                // Poll User Home Timeline 1/min
                this.poll(60000,"https://api.twitter.com/1.1/statuses/home_timeline.json");
            } else if (this.user === "user") {
                var users = node.tags.split(/\s*,\s*/).filter(v=>!!v);
                if (users.length === 0) {
                    node.error(RED._("twitter.warn.nousers"));
                    return;
                }
                // Poll User timeline
                users.forEach(function(user) {
                    node.poll(60000,"https://api.twitter.com/1.1/statuses/user_timeline.json",{screen_name: user});
                })
            } else if (this.user === "dm") {
                node.pollDirectMessages();
            } else if (this.user === "event") {
                this.error("This Twitter node is configured to access a user's activity stream. Twitter removed this API in August 2018 and is no longer available.");
                return;
            } else if (this.user === "false") {
                var twit = new Ntwitter({
                    consumer_key: credentials.consumer_key,
                    consumer_secret: credentials.consumer_secret,
                    access_token_key: credentials.access_token,
                    access_token_secret: credentials.access_token_secret
                });

                // Stream public tweets
                try {
                    var thing = 'statuses/filter';
                    var tags = node.tags;
                    var st = { track: [tags] };

                    var setupStream = function() {
                        if (node.restart) {
                            node.status({fill:"green", shape:"dot", text:(tags||" ")});
                            twit.stream(thing, st, function(stream) {
                                //console.log("ST",st);
                                node.stream = stream;
                                stream.on('data', function(tweet) {
                                    if (tweet.user !== undefined) {
                                        var where = tweet.user.location;
                                        var la = tweet.lang || tweet.user.lang;
                                        var msg = { topic:node.topic+"/"+tweet.user.screen_name, payload:tweet.text, lang:la, tweet:tweet };
                                        if (where) {
                                            msg.location = {place:where};
                                            addLocationToTweet(msg);
                                        }
                                        node.send(msg);
                                        //node.status({fill:"green", shape:"dot", text:(tags||" ")});
                                    }
                                });
                                stream.on('limit', function(tweet) {
                                    //node.status({fill:"grey", shape:"dot", text:RED._("twitter.errors.limitrate")});
                                    node.status({fill:"grey", shape:"dot", text:(tags||" ")});
                                    node.tout2 = setTimeout(function() { node.status({fill:"green", shape:"dot", text:(tags||" ")}); },10000);
                                });
                                stream.on('error', function(tweet,rc) {
                                    //console.log("ERRO",rc,tweet);
                                    if (rc == 420) {
                                        node.status({fill:"red", shape:"ring", text:RED._("twitter.errors.ratelimit")});
                                    }
                                    else {
                                        node.status({fill:"red", shape:"ring", text:tweet.toString()});
                                        node.warn(RED._("twitter.errors.streamerror",{error:tweet.toString(),rc:rc}));
                                    }
                                    twitterRateTimeout = Date.now() + retry;
                                    if (node.restart) {
                                        node.tout = setTimeout(function() { setupStream() },retry);
                                    }
                                });
                                stream.on('destroy', function (response) {
                                    //console.log("DEST",response)
                                    twitterRateTimeout = Date.now() + 15000;
                                    if (node.restart) {
                                        node.status({fill:"red", shape:"dot", text:" "});
                                        node.warn(RED._("twitter.errors.unexpectedend"));
                                        node.tout = setTimeout(function() { setupStream() },15000);
                                    }
                                });
                            });
                        }
                    }

                    // if 4 numeric tags that look like a geo area then set geo area
                    var bits = node.tags.split(",");
                    if (bits.length == 4) {
                        if ((Number(bits[0]) < Number(bits[2])) && (Number(bits[1]) < Number(bits[3]))) {
                            st = { locations: node.tags };
                            node.log(RED._("twitter.status.using-geo",{location:node.tags.toString()}));
                        }
                    }

                    // all public tweets
                    if (this.user === "false") {
                        node.on("input", function(msg) {
                            if (this.tags === '') {
                                if (node.tout) { clearTimeout(node.tout); }
                                if (node.tout2) { clearTimeout(node.tout2); }
                                if (this.stream) {
                                    this.restart = false;
                                    node.stream.removeAllListeners();
                                    this.stream.destroy();
                                }
                                if ((typeof msg.payload === "string") && (msg.payload !== "")) {
                                    st = { track:[msg.payload] };
                                    tags = msg.payload;

                                    this.restart = true;
                                    if ((twitterRateTimeout - Date.now()) > 0 ) {
                                        node.status({fill:"red", shape:"ring", text:tags});
                                        node.tout = setTimeout(function() {
                                            setupStream();
                                        }, twitterRateTimeout - Date.now() );
                                    }
                                    else {
                                        setupStream();
                                    }
                                }
                                else {
                                    node.status({fill:"yellow", shape:"ring", text:RED._("twitter.warn.waiting")});
                                }
                            }
                        });
                    }

                    // wait for input or start the stream
                    if ((this.user === "false") && (tags === '')) {
                        node.status({fill:"yellow", shape:"ring", text:RED._("twitter.warn.waiting")});
                    }
                    else {
                        this.restart = true;
                        setupStream();
                    }
                }
                catch (err) {
                    node.error(err);
                }
            }
            this.on('close', function() {
                if (this.tout) { clearTimeout(this.tout); }
                if (this.tout2) { clearTimeout(this.tout2); }
                if (this.stream) {
                    this.restart = false;
                    this.stream.removeAllListeners();
                    this.stream.destroy();
                }
                if (this.timeout_ids) {
                    for (var i=0; i<this.timeout_ids.length; i++) {
                        clearTimeout(this.timeout_ids[i]);
                    }
                }
                if (this.poll_ids) {
                    for (var i=0; i<this.poll_ids.length; i++) {
                        clearInterval(this.poll_ids[i]);
                    }
                }
            });
        } else {
            this.error(RED._("twitter.errors.missingcredentials"));
        }

    }
    RED.nodes.registerType("twitter in",TwitterInNode);

    TwitterInNode.prototype.poll = function(interval, url, opts) {
        var node = this;
        var opts = opts || {};
        var pollId;
        opts.count = 1;
        this.twitterConfig.get(url,opts).then(function(result) {
            if (result.status === 429) {
                node.warn("Rate limit hit. Waiting "+Math.floor(result.rateLimitTimeout/1000)+" seconds to try again");
                node.timeout_ids.push(setTimeout(function() {
                    node.poll(interval,url,opts);
                },result.rateLimitTimeout))
                return;
            }
            node.debug("Twitter Poll, rateLimitRemaining="+result.rateLimitRemaining+" rateLimitTimeout="+Math.floor(result.rateLimitTimeout/1000)+"s");
            var res = result.body;
            opts.count = 200;
            var since = "0";
            if (res.length > 0) {
                since = res[0].id_str;
            }
            pollId = setInterval(function() {
                opts.since_id = since;
                node.twitterConfig.get(url,opts).then(function(result) {
                    if (result.status === 429) {
                        node.warn("Rate limit hit. Waiting "+Math.floor(result.rateLimitTimeout/1000)+" seconds to try again");
                        clearInterval(pollId);
                        node.timeout_ids.push(setTimeout(function() {
                            node.poll(interval,url,opts);
                        },result.rateLimitTimeout))
                        return;
                    }
                    node.debug("Twitter Poll, rateLimitRemaining="+result.rateLimitRemaining+" rateLimitTimeout="+Math.floor(result.rateLimitTimeout/1000)+"s");
                    var res = result.body;
                    if (res.errors) {
                        node.error(res.errors[0].message);
                        if (res.errors[0].code === 44) {
                            // 'since_id parameter is invalid' - reset it for next time
                            delete opts.since_id;
                        }
                        clearInterval(pollId);
                        node.timeout_ids.push(setTimeout(function() {
                            node.poll(interval,url,opts);
                        },interval))
                        return;
                    }
                    if (res.length > 0) {
                        since = res[0].id_str;
                        var len = res.length;
                        for (var i = len-1; i >= 0; i--) {
                            var tweet = res[i];
                            if (tweet.user !== undefined) {
                                var where = tweet.user.location;
                                var la = tweet.lang || tweet.user.lang;
                                tweet.text = tweet.text || tweet.full_text;
                                var msg = {
                                    topic:"tweets/"+tweet.user.screen_name,
                                    payload:tweet.text,
                                    lang:la,
                                    tweet:tweet
                                };
                                if (where) {
                                    msg.location = {place:where};
                                    addLocationToTweet(msg);
                                }
                                node.send(msg);
                            }
                        }
                    }
                }).catch(function(err) {
                    node.error(err);
                    clearInterval(pollId);
                    node.timeout_ids.push(setTimeout(function() {
                        delete opts.since_id;
                        delete opts.count;
                        node.poll(interval,url,opts);
                    },interval))
                })
            },interval)
            node.poll_ids.push(pollId);
        }).catch(function(err) {
            node.error(err);
            node.timeout_ids.push(setTimeout(function() {
                delete opts.since_id;
                delete opts.count;
                node.poll(interval,url,opts);
            },interval))
        })
    }

    TwitterInNode.prototype.pollDirectMessages = function() {
        var interval = 70000;
        var node = this;
        var opts = {};
        var url = "https://api.twitter.com/1.1/direct_messages/events/list.json";
        var pollId;
        opts.count = 50;
        this.twitterConfig.get(url,opts).then(function(result) {
            if (result.status === 429) {
                node.warn("Rate limit hit. Waiting "+Math.floor(result.rateLimitTimeout/1000)+" seconds to try again");
                node.timeout_ids.push(setTimeout(function() {
                    node.pollDirectMessages();
                },result.rateLimitTimeout))
                return;
            }
            node.debug("Twitter DM Poll, rateLimitRemaining="+result.rateLimitRemaining+" rateLimitTimeout="+Math.floor(result.rateLimitTimeout/1000)+"s");
            var res = result.body;
            if (res.errors) {
                node.error(res.errors[0].message);
                node.timeout_ids.push(setTimeout(function() {
                    node.pollDirectMessages();
                },interval))
                return;
            }
            var since = "0";
            var messages = res.events.filter(tweet => tweet.type === 'message_create' && tweet.id > since);
            if (messages.length > 0) {
                since = messages[0].id;
            }
            pollId = setInterval(function() {
                node.twitterConfig.get(url,opts).then(function(result) {
                    if (result.status === 429) {
                        node.warn("Rate limit hit. Waiting "+Math.floor(result.rateLimitTimeout/1000)+" seconds to try again");
                        clearInterval(pollId);
                        node.timeout_ids.push(setTimeout(function() {
                            node.pollDirectMessages();
                        },result.rateLimitTimeout))
                        return;
                    }
                    node.debug("Twitter DM Poll, rateLimitRemaining="+result.rateLimitRemaining+" rateLimitTimeout="+Math.floor(result.rateLimitTimeout/1000)+"s");
                    var res = result.body;
                    if (res.errors) {
                        node.error(res.errors[0].message);
                        clearInterval(pollId);
                        node.timeout_ids.push(setTimeout(function() {
                            node.pollDirectMessages();
                        },interval))
                        return;
                    }
                    var messages = res.events.filter(tweet => tweet.type === 'message_create' && tweet.id > since);
                    if (messages.length > 0) {
                        since = messages[0].id;
                        var len = messages.length;
                        var missingUsers = {};
                        var tweets = [];
                        for (var i = len-1; i >= 0; i--) {
                            var tweet = messages[i];
                            // node.log(JSON.stringify(tweet," ",4));
                            var output = {
                                id: tweet.id,
                                id_str: tweet.id,
                                text: tweet.message_create.message_data.text,
                                created_timestamp: tweet.created_timestamp,
                                entities: tweet.message_create.message_data.entities
                            }
                            if (!userObjectCache.hasOwnProperty(tweet.message_create.sender_id)) {
                                missingUsers[tweet.message_create.sender_id] = true;
                            }
                            if (!userObjectCache.hasOwnProperty(tweet.message_create.target.recipient_id)) {
                                missingUsers[tweet.message_create.target.recipient_id] = true;
                            }
                            tweets.push(output);
                        }

                        var missingUsernames = Object.keys(missingUsers).join(",");
                        return node.twitterConfig.getUsers(missingUsernames).then(function() {
                            var len = tweets.length;
                            for (var i = 0; i < len; i++) {
                                var tweet = messages[i];
                                var output = tweets[i];
                                output.sender = userObjectCache[tweet.message_create.sender_id];
                                output.sender_id = output.sender.id;
                                output.sender_id_str = output.sender.id_str;
                                output.sender_screen_name = output.sender.screen_name;

                                output.recipient = userObjectCache[tweet.message_create.target.recipient_id];
                                output.recipient_id = output.recipient.id;
                                output.recipient_id_str = output.recipient.id_str;
                                output.recipient_screen_name = output.recipient.screen_name;

                                if (output.sender_screen_name !== node.twitterConfig.screen_name) {
                                    var msg = {
                                        topic:"tweets/"+output.sender_screen_name,
                                        payload:output.text,
                                        tweet:output
                                    };
                                    node.send(msg);
                                }
                            }

                        })
                    }
                }).catch(function(err) {
                    node.error(err);
                    clearInterval(pollId);
                    node.timeout_ids.push(setTimeout(function() {
                        node.pollDirectMessages();
                    },interval))
                })
            },interval)
            node.poll_ids.push(pollId);
        }).catch(function(err) {
            node.error(err);
            node.timeout_ids.push(setTimeout(function() {
                node.pollDirectMessages();
            },interval))
        })
    }

    function TwitterOutNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic;
        this.twitter = n.twitter;
        this.twitterConfig = RED.nodes.getNode(this.twitter);
        var credentials = RED.nodes.getCredentials(this.twitter);
        var node = this;
        node.status({});
        if (this.twitterConfig.oauth) {
            var twit = new Ntwitter({
                consumer_key: credentials.consumer_key,
                consumer_secret: credentials.consumer_secret,
                access_token_key: credentials.access_token,
                access_token_secret: credentials.access_token_secret
            });

            node.on("input", function(msg) {
                if (msg.hasOwnProperty("payload")) {
                    node.status({fill:"blue",shape:"dot",text:"twitter.status.tweeting"});
                    if (msg.payload.slice(0,2).toLowerCase() === "d ") {
                        var dm_user;
                        // direct message syntax: "D user message"
                        var t = msg.payload.match(/D\s+(\S+)\s+(.*)/).slice(1);
                        dm_user = t[0];
                        msg.payload = t[1];
                        var lookupPromise;
                        if (userSreenNameToIdCache.hasOwnProperty(dm_user)) {
                            lookupPromise = Promise.resolve();
                        } else {
                            lookupPromise = node.twitterConfig.getUsers(dm_user,"screen_name")
                        }
                        lookupPromise.then(function() {
                            if (userSreenNameToIdCache.hasOwnProperty(dm_user)) {
                                // Send a direct message
                                node.twitterConfig.post("https://api.twitter.com/1.1/direct_messages/events/new.json",{
                                    event: {
                                        type: "message_create",
                                        "message_create": {
                                            "target": {
                                                "recipient_id": userSreenNameToIdCache[dm_user]
                                            },
                                            "message_data": {"text": msg.payload}
                                        }
                                    }
                                }).then(function() {
                                    node.status({});
                                }).catch(function(err) {
                                    node.error(err,msg);
                                    node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                                });
                            } else {
                                node.error("Unknown user",msg);
                                node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                            }
                        }).catch(function(err) {
                            node.error(err,msg);
                            node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                        })
                    } else {
                        if (msg.payload.length > 280) {
                            msg.payload = msg.payload.slice(0,279);
                            node.warn(RED._("twitter.errors.truncated"));
                        }
                        var mediaPromise;
                        if (msg.media && Buffer.isBuffer(msg.media)) {
                            // var mediaType = fileType(msg.media);
                            // if (mediaType === null) {
                            //     node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                            //     node.error("msg.media is not a valid media object",msg);
                            //     return;
                            // }
                            mediaPromise = node.twitterConfig.post("https://upload.twitter.com/1.1/media/upload.json",null,null,{
                                media: msg.media
                            }).then(function(result) {
                                if (result.status === 200) {
                                    return result.body.media_id_string;
                                } else {
                                    throw new Error(result.body.errors[0]);
                                }
                            });

                        } else {
                            mediaPromise = Promise.resolve();
                        }
                        mediaPromise.then(function(mediaId) {
                            var params = msg.params || {};
                            params.status = msg.payload;
                            if (mediaId) {
                                params.media_ids = mediaId;
                            }
                            node.twitterConfig.post("https://api.twitter.com/1.1/statuses/update.json",{},params).then(function(result) {
                                if (result.status === 200) {
                                    node.status({});
                                } else {
                                    node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                                    
                                    if ('error' in result.body && typeof result.body.error === 'string') {
                                        node.error(result.body.error,msg);
                                    } else {
                                        node.error(result.body.errors[0].message,msg);
                                    }
                                }
                            }).catch(function(err) {
                                node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                                node.error(err,msg);
                            })
                        }).catch(function(err) {
                            node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                            node.error(err,msg);
                        });
                        // if (msg.payload.length > 280) {
                        //     msg.payload = msg.payload.slice(0,279);
                        //     node.warn(RED._("twitter.errors.truncated"));
                        // }
                        // if (msg.media && Buffer.isBuffer(msg.media)) {
                        //     var apiUrl = "https://api.twitter.com/1.1/statuses/update_with_media.json";
                        //     var signedUrl = oa.signUrl(apiUrl,credentials.access_token,credentials.access_token_secret,"POST");
                        //     var r = request.post(signedUrl,function(err,httpResponse,body) {
                        //         if (err) {
                        //             node.error(err,msg);
                        //             node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                        //         }
                        //         else {
                        //             var response = JSON.parse(body);
                        //             if (response.errors) {
                        //                 var errorList = response.errors.map(function(er) { return er.code+": "+er.message }).join(", ");
                        //                 node.error(RED._("twitter.errors.sendfail",{error:errorList}),msg);
                        //                 node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                        //             }
                        //             else {
                        //                 node.status({});
                        //             }
                        //         }
                        //     });
                        //     var form = r.form();
                        //     form.append("status",msg.payload);
                        //     form.append("media[]",msg.media,{filename:"image"});
                        //
                        // } else {
                        //     if (typeof msg.params === 'undefined') { msg.params = {}; }
                        //     twit.updateStatus(msg.payload, msg.params, function (err, data) {
                        //         if (err) {
                        //             node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                        //             node.error(err,msg);
                        //         }
                        //         node.status({});
                        //     });
                        // }
                    }
                }
            });
        } else {
            this.error(RED._("twitter.errors.missingcredentials"));
        }
    }
    RED.nodes.registerType("twitter out",TwitterOutNode);
}
