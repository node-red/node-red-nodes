
module.exports = function(RED) {
    var version = RED.version();
    var parts = /^(\d)+\.(\d)+\.(\d)+/.exec(version);
    if (parts) {
        var major = parseInt(parts[1]);
        if (major > 2) {
            throw new Error("This module is not required for Node-RED 3 or later")
        }
    }
    function JunctionNode(n) {
        RED.nodes.createNode(this,n);
        this.on("input",function(msg, send, done) {
            send(msg);
            done();
        });
    }
    RED.nodes.registerType("junction",JunctionNode);
}
