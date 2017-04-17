
module.exports = function(RED) {
    "use strict";
    var Ntwitter = require('twitter-ng');
    var OAuth= require('oauth').OAuth;
    var request = require('request');
    var twitterRateTimeout;

    function TwitterNode(n) {
        RED.nodes.createNode(this,n);
        this.screen_name = n.screen_name;
    }
    RED.nodes.registerType("twitter-credentials",TwitterNode,{
        credentials: {
            screen_name: {type:"text"},
            access_token: {type: "password"},
            access_token_secret: {type:"password"}
        }
    });


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
        this.tags = n.tags;
        this.twitter = n.twitter;
        this.topic = n.topic||"tweets";
        this.twitterConfig = RED.nodes.getNode(this.twitter);
        var credentials = RED.nodes.getCredentials(this.twitter);

        if (credentials && credentials.screen_name == this.twitterConfig.screen_name) {
            var twit = new Ntwitter({
                consumer_key: "OKjYEd1ef2bfFolV25G5nQ",
                consumer_secret: "meRsltCktVMUI8gmggpXett7WBLd1k0qidYazoML6g",
                access_token_key: credentials.access_token,
                access_token_secret: credentials.access_token_secret
            });

            //setInterval(function() {
            //        twit.get("/application/rate_limit_status.json",null,function(err,cb) {
            //                console.log("direct_messages:",cb["resources"]["direct_messages"]);
            //        });
            //
            //},10000);

            var node = this;
            if (this.user === "user") {
                node.poll_ids = [];
                node.since_ids = {};
                node.status({});
                var users = node.tags.split(",");
                if (users === '') { node.warn(RED._("twitter.warn.nousers")); }
                //if (users.length === 0) { node.warn(RED._("twitter.warn.nousers")); }
                else {
                    for (var i=0; i<users.length; i++) {
                        var user = users[i].replace(" ","");
                        twit.getUserTimeline({
                            screen_name:user,
                            trim_user:0,
                            count:1
                        },(function() {
                            var u = user+"";
                            return function(err,cb) {
                                if (err) {
                                    node.error(err);
                                    return;
                                }
                                if (cb[0]) {
                                    node.since_ids[u] = cb[0].id_str;
                                }
                                else {
                                    node.since_ids[u] = '0';
                                }
                                node.poll_ids.push(setInterval(function() {
                                    twit.getUserTimeline({
                                        screen_name:u,
                                        trim_user:0,
                                        since_id:node.since_ids[u]
                                    }, function(err,cb) {
                                        if (cb) {
                                            for (var t=cb.length-1; t>=0; t-=1) {
                                                var tweet = cb[t];
                                                var where = tweet.user.location;
                                                var la = tweet.lang || tweet.user.lang;
                                                var msg = { topic:node.topic+"/"+tweet.user.screen_name, payload:tweet.text, lang:la, tweet:tweet };
                                                if (where) {
                                                    msg.location = {place:where};
                                                    addLocationToTweet(msg);
                                                }
                                                node.send(msg);
                                                if (t === 0) {
                                                    node.since_ids[u] = tweet.id_str;
                                                }
                                            }
                                        }
                                        if (err) {
                                            node.error(err);
                                        }
                                    });
                                },60000));
                            }
                        }()));
                    }
                }
            }
            else if (this.user === "dm") {
                node.poll_ids = [];
                node.status({});
                twit.getDirectMessages({
                    screen_name:node.twitterConfig.screen_name,
                    trim_user:0,
                    count:1
                },function(err,cb) {
                    if (err) {
                        node.error(err);
                        return;
                    }
                    if (cb[0]) {
                        node.since_id = cb[0].id_str;
                    }
                    else {
                        node.since_id = '0';
                    }
                    node.poll_ids.push(setInterval(function() {
                        twit.getDirectMessages({
                            screen_name:node.twitterConfig.screen_name,
                            trim_user:0,
                            since_id:node.since_id
                        },function(err,cb) {
                                if (cb) {
                                    for (var t=cb.length-1; t>=0; t-=1) {
                                        var tweet = cb[t];
                                        var where = tweet.sender.location;
                                        var la = tweet.lang || tweet.sender.lang;
                                        var msg = { topic:node.topic+"/"+tweet.sender.screen_name, payload:tweet.text, lang:la, tweet:tweet };
                                        if (where) {
                                            msg.location = {place:where};
                                            addLocationToTweet(msg);
                                        }
                                        node.send(msg);
                                        if (t === 0) {
                                            node.since_id = tweet.id_str;
                                        }
                                    }
                                }
                                if (err) {
                                    node.error(err);
                                }
                            });
                    },120000));
                });
            }
            else if (this.user === "event") {
                try {
                    var thingu = 'user';
                    var setupEvStream = function() {
                        if (node.active) {
                            twit.stream(thingu, st, function(stream) {
                                node.status({fill:"green", shape:"dot", text:" "});
                                node.stream = stream;
                                stream.on('data', function(tweet) {
                                    if (tweet.event !== undefined) {
                                        var where = tweet.source.location;
                                        var la = tweet.source.lang;
                                        var msg = { topic:node.topic+"/"+tweet.source.screen_name, payload:tweet.event, lang:la, tweet:tweet };
                                        if (where) {
                                            msg.location = {place:where};
                                            addLocationToTweet(msg);
                                        }
                                        node.send(msg);
                                    }
                                });
                                stream.on('limit', function(tweet) {
                                    node.status({fill:"grey", shape:"dot", text:" "});
                                    node.tout2 = setTimeout(function() { node.status({fill:"green", shape:"dot", text:" "}); },10000);
                                });
                                stream.on('error', function(tweet,rc) {
                                    //console.log("ERRO",rc,tweet);
                                    if (rc == 420) {
                                        node.status({fill:"red", shape:"ring", text:RED._("twitter.errors.ratelimit")});
                                    }
                                    else {
                                        node.status({fill:"red", shape:"ring", text:" "});
                                        node.warn(RED._("twitter.errors.streamerror",{error:tweet.toString(),rc:rc}));
                                    }
                                    twitterRateTimeout = Date.now() + retry;
                                    if (node.restart) {
                                        node.tout = setTimeout(function() { setupEvStream() },retry);
                                    }
                                });
                                stream.on('destroy', function (response) {
                                    //console.log("DEST",response)
                                    twitterRateTimeout = Date.now() + 15000;
                                    if (node.restart) {
                                        node.status({fill:"red", shape:"dot", text:" "});
                                        node.warn(RED._("twitter.errors.unexpectedend"));
                                        node.tout = setTimeout(function() { setupEvStream() },15000);
                                    }
                                });
                            });
                        }
                    }
                    setupEvStream();
                }
                catch (err) {
                    node.error(err);
                }
            }
            else {
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
                                var retry = 60000; // 60 secs backoff for now
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

                    // ask for users stream instead of public
                    if (this.user === "true") {
                        thing = 'user';
                        // twit.getFriendsIds(node.twitterConfig.screen_name.substr(1), function(err,list) {
                        //     friends = list;
                        // });
                        st = null;
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
        }
        else {
            this.error(RED._("twitter.errors.missingcredentials"));
        }

        this.on('close', function() {
            if (node.tout) { clearTimeout(node.tout); }
            if (node.tout2) { clearTimeout(node.tout2); }
            if (this.stream) {
                this.restart = false;
                node.stream.removeAllListeners();
                this.stream.destroy();
            }
            if (this.poll_ids) {
                for (var i=0; i<this.poll_ids.length; i++) {
                    clearInterval(this.poll_ids[i]);
                }
            }
        });
    }
    RED.nodes.registerType("twitter in",TwitterInNode);


    function TwitterOutNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic;
        this.twitter = n.twitter;
        this.twitterConfig = RED.nodes.getNode(this.twitter);
        var credentials = RED.nodes.getCredentials(this.twitter);
        var node = this;

        if (credentials && credentials.screen_name == this.twitterConfig.screen_name) {
            var twit = new Ntwitter({
                consumer_key: "OKjYEd1ef2bfFolV25G5nQ",
                consumer_secret: "meRsltCktVMUI8gmggpXett7WBLd1k0qidYazoML6g",
                access_token_key: credentials.access_token,
                access_token_secret: credentials.access_token_secret
            });
            node.on("input", function(msg) {
                if (msg.hasOwnProperty("payload")) {
                    node.status({fill:"blue",shape:"dot",text:"twitter.status.tweeting"});

                    if (msg.payload.length > 140) {
                        msg.payload = msg.payload.slice(0,139);
                        node.warn(RED._("twitter.errors.truncated"));
                    }

                    if (msg.media && Buffer.isBuffer(msg.media)) {
                        var apiUrl = "https://api.twitter.com/1.1/statuses/update_with_media.json";
                        var signedUrl = oa.signUrl(apiUrl,
                            credentials.access_token,
                            credentials.access_token_secret,
                            "POST");

                        var r = request.post(signedUrl,function(err,httpResponse,body) {
                            if (err) {
                                node.error(err,msg);
                                node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                            }
                            else {
                                var response = JSON.parse(body);
                                if (response.errors) {
                                    var errorList = response.errors.map(function(er) { return er.code+": "+er.message }).join(", ");
                                    node.error(RED._("twitter.errors.sendfail",{error:errorList}),msg);
                                    node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                                }
                                else {
                                    node.status({});
                                }
                            }
                        });
                        var form = r.form();
                        form.append("status",msg.payload);
                        form.append("media[]",msg.media,{filename:"image"});

                    }
                    else {
                        if (typeof msg.params === 'undefined') { msg.params = {}; }
                        twit.updateStatus(msg.payload, msg.params, function (err, data) {
                            if (err) {
                                node.status({fill:"red",shape:"ring",text:"twitter.status.failed"});
                                node.error(err,msg);
                            }
                            node.status({});
                        });
                    }
                }
                else { node.warn(RED._("twitter.errors.nopayload")); }
            });
        }
    }
    RED.nodes.registerType("twitter out",TwitterOutNode);

    var oa = new OAuth(
        "https://api.twitter.com/oauth/request_token",
        "https://api.twitter.com/oauth/access_token",
        "OKjYEd1ef2bfFolV25G5nQ",
        "meRsltCktVMUI8gmggpXett7WBLd1k0qidYazoML6g",
        "1.0",
        null,
        "HMAC-SHA1"
    );

    RED.httpAdmin.get('/twitter-credentials/:id/auth', function(req, res) {
        var credentials = {};
        oa.getOAuthRequestToken({
            oauth_callback: req.query.callback
        },function(error, oauth_token, oauth_token_secret, results) {
            if (error) {
                var err = {statusCode: 401, data: "dummy error"};
                var resp = RED._("twitter.errors.oautherror",{statusCode: err.statusCode, errorData: err.data});
                res.send(resp)
            }
            else {
                credentials.oauth_token = oauth_token;
                credentials.oauth_token_secret = oauth_token_secret;
                res.redirect('https://api.twitter.com/oauth/authorize?oauth_token='+oauth_token)
                RED.nodes.addCredentials(req.params.id,credentials);
            }
        });
    });

    RED.httpAdmin.get('/twitter-credentials/:id/auth/callback', function(req, res, next) {
        var credentials = RED.nodes.getCredentials(req.params.id);
        credentials.oauth_verifier = req.query.oauth_verifier;

        oa.getOAuthAccessToken(
            credentials.oauth_token,
            credentials.token_secret,
            credentials.oauth_verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results) {
                if (error) {
                    RED.log.error(error);
                    res.send(RED._("twitter.errors.oauthbroke"));
                }
                else {
                    credentials = {};
                    credentials.access_token = oauth_access_token;
                    credentials.access_token_secret = oauth_access_token_secret;
                    credentials.screen_name = "@"+results.screen_name;
                    RED.nodes.addCredentials(req.params.id,credentials);
                    res.send(RED._("twitter.errors.authorized"));
                }
            }
        );
    });
}
