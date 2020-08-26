const should = require("should");
const helper = require("node-red-node-test-helper");
const feedParserNode = require("../../../social/feedparser/32-feedparse");

describe("FeedParseNode", () => {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it("should be loaded", (done) => {
        const flow = [{id:"n1", type:"feedparse", interval: 15, url: "test", name: "feedparse" }];
        helper.load(feedParserNode, flow, () => {
            const n1 = helper.getNode("n1");
            n1.should.have.property("name", "feedparse");
            done();
        });
    });

    it("get feed", (done) => {
        const flow = [
            {id:"n1", type:"feedparse", interval: 15, url: "https://discourse.nodered.org/posts.rss", name: "feedparse" , wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];
        helper.load(feedParserNode, flow, () => {
            const n2 = helper.getNode("n2");
            const n1 = helper.getNode("n1");
            let count = 0;
            n2.on("input", (msg) => {
                msg.topic.should.startWith("https://discourse.nodered.org/");
                if(count === 0){
                    done();
                    count++;
                }
            });
        });
    });

    it("invalid interval", (done) => {
        const flow = [
            {id:"n1", type:"feedparse", interval: 35791, url: "https://discourse.nodered.org/posts.rss", name: "feedparse" , wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];
        helper.load(feedParserNode, flow, () => {
            const n2 = helper.getNode("n2");
            const n1 = helper.getNode("n1");
            n1.on('call:warn', call => {
                call.should.have.property("lastArg", "feedparse.errors.invalidinterval");
                done();
            });
        });
    });

    it("bad host", (done) => {
        const flow = [
            {id:"n1", type:"feedparse", interval: 15, url: "https://discourse.nodered.org/dummy.rss", name: "feedparse" , wires:[["n2"]] },
            { id: "n2", type: "helper" }
        ];
        helper.load(feedParserNode, flow, () => {
            const n2 = helper.getNode("n2");
            const n1 = helper.getNode("n1");
            n1.on('call:warn', call => {
                call.lastArg.should.have.startWith("feedparse.errors.badstatuscode");
                done();
            });
        });
    });
});
