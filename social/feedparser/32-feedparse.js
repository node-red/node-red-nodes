
module.exports = function(RED) {
    "use strict";
    const { parseFeed } = require('@rowanmanning/feed-parser');

    function FeedParseNode(n) {
        RED.nodes.createNode(this,n);
        this.url = n.url;
        if (n.interval > 35790) { this.warn(RED._("feedparse.errors.invalidinterval")) }
        this.interval = (parseInt(n.interval)||15) * 60000;
        this.interval_id = null;
        this.ignorefirst = n.ignorefirst || false;
        this.sendarray = n.sendarray || false;
        this.seen = {};
        this.donefirst = false;
        var node = this;

        async function getFeed() {
            if (node.url && typeof node.url === "string" && node.url !== "") {
                const response = await fetch(node.url).catch((error) => {
                    node.error("Failed Fetch: "+node.url, error)
                    node.status({fill:"red",shape:"dot",text:RED._("feedparse.errors.failedfetch")});
                    return;
                });
                if (response.status !== 200) {
                    node.error("Bad Feed: "+node.url, response)
                    node.status({fill:"red",shape:"dot",text:response.status+": "+RED._("feedparse.errors.badstatuscode")});
                    return;
                }
                const feed = parseFeed(await response.text());
                if (node.sendarray === true) {
                    var msg = JSON.parse(JSON.stringify(feed));
                    node.send(msg);
                }
                else {
                    for (let a=0; a<feed.items.length; a++) {
                        const article = feed.items[a];
                        if (!(article.id in node.seen) || ( node.seen[article.id] !== 0 && node.seen[article.id] != new Date(article.published).getTime())) {
                            node.seen[article.id] = article.published ? new Date(article.published).getTime() : 0;
                            const msg = { article: JSON.parse(JSON.stringify(article)) };
                            msg.topic = msg.article.title;
                            msg.payload = msg.article.description;
                            msg.link = msg.article.url
                            msg.feed = node.url;

                            if (node.ignorefirst === true && node.donefirst === false) {
                                // do nothing
                            }
                            else {
                                node.send(msg);
                            }
                        }
                    }
                }
                node.status({fill:"green",shape:"dot",text:""});
            }
            else {
                node.status({fill:"red",shape:"dot",text:RED._("feedparse.errors.invalidurl")});
                node.error(RED._("feedparse.errors.invalidurl")+": "+node.url);
            }
        }

        node.interval_id = setInterval(function() { node.donefirst = true; getFeed(); }, node.interval);
        setTimeout(getFeed, 2000);

        node.on("close", function() {
            if (this.interval_id != null) {
                clearInterval(this.interval_id);
            }
        });
    }

    RED.nodes.registerType("feedparse",FeedParseNode);
}
