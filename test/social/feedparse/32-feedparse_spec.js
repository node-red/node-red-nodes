const should = require("should");
const helper = require("node-red-node-test-helper");
const feedParserNode = require("../../../social/feedparser/32-feedparse");

describe("FeedParseNode", () => {

    beforeEach(async function () {
        helper.startServer();
    });

    afterEach(async function () {
        helper.unload();
        helper.stopServer();
    });

    it("should be loaded",  async function () {
        const flow = [{id:"n1", type:"feedparse", interval: 15, url: "test", name: "feedparse" }];
        helper.load(feedParserNode, flow, () => {
            const n1 = helper.getNode("n1");
            n1.should.have.property("name", "feedparse");
            //done();
        });
    });


    it("get news feed",  async function () {
        const flow = [
            {id:"n1", type:"feedparse", interval: 15, url: "https://feeds.bbci.co.uk/news/rss.xml?edition=uk", name: "feedparse" , wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];
        await helper.load(feedParserNode, flow, () => {
            const n2 = helper.getNode("n2");
            //const n1 = helper.getNode("n1");
            let count = 0;
            n2.on("input", async function(msg) {
                console.log("REPLY IS", msg);
                msg.topic.should.startWith("http://feeds.bbci.co.uk");
                if (count === 0){
                    // done();
                    count++;
                }
            });
        });
    });

    it("invalid interval",  async function () {
        const flow = [
            {id:"n1", type:"feedparse", interval: 35791, url: "https://feeds.bbci.co.uk/news/rss.xml?edition=uk", name: "feedparse" , wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];
        await helper.load(feedParserNode, flow, () => {
            const n2 = helper.getNode("n2");
            const n1 = helper.getNode("n1");
            n1.on('call:warn', call => {
                call.should.have.property("lastArg", "feedparse.errors.invalidinterval");
                // done();
            });
        });
    });

    it("bad host", async function () {
        const flow = [
            {id:"n1", type:"feedparse", interval: 15, url: "https://discourse.nodered.org/dummy.rss", name: "feedparse" , wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];
        await helper.load(feedParserNode, flow, () => {
            const n2 = helper.getNode("n2");
            const n1 = helper.getNode("n1");
            n1.on('call:warn', call => {
                call.lastArg.should.have.startWith("feedparse.errors.badstatuscode");
                // done();
            });
        });
    });
});
