
module.exports = function(RED) {
    "use strict";
    var FeedParser = require("feedparser");
    var request = require("request");
    var url = require('url');

    function FeedParseNode(n) {
        RED.nodes.createNode(this,n);
        this.url = n.url;
        this.interval = (parseInt(n.interval)||15) * 60000;
        var node = this;
        this.interval_id = null;
        this.seen = {};
        var parsedUrl = url.parse(this.url);
        if (!(parsedUrl.host || (parsedUrl.hostname && parsedUrl.port)) && !parsedUrl.isUnix) {
            this.error(RED._("feedparse.errors.invalidurl"));
        }
        else {
            var getFeed = function() {
                var req = request(node.url, {timeout: 10000, pool: false});
                //req.setMaxListeners(50);
                //req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
                //req.setHeader('accept', 'text/html,application/xhtml+xml');

                var feedparser = new FeedParser();

                req.on('error', function(err) { node.error(err); });

                req.on('response', function(res) {
                    if (res.statusCode != 200) { node.warn(RED._("feedparse.errors.badstatuscode")+" "+res.statusCode); }
                    else { res.pipe(feedparser); }
                });

                feedparser.on('error', function(error) { node.error(error); });

                feedparser.on('readable', function () {
                    var stream = this, article;
                    while (article = stream.read()) {  // jshint ignore:line
                        if (!(article.guid in node.seen) || ( node.seen[article.guid] !== 0 && node.seen[article.guid] != article.date.getTime())) {
                            node.seen[article.guid] = article.date?article.date.getTime():0;
                            var msg = {
                                topic: article.origlink || article.link,
                                payload: article.description,
                                article: article
                            };
                            node.send(msg);
                        }
                    }
                });

                feedparser.on('meta', function (meta) {});
                feedparser.on('end', function () {});
            };
            this.interval_id = setInterval(function() { getFeed(); }, node.interval);
            getFeed();
        }

        this.on("close", function() {
            if (this.interval_id != null) {
                clearInterval(this.interval_id);
            }
        });
    }

    RED.nodes.registerType("feedparse",FeedParseNode);
}
