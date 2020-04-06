
module.exports = function(RED) {
    var version = RED.version();
    var parts = /^(\d)+\.(\d)+\.(\d)+/.exec(version);
    if (parts) {
        var major = parseInt(parts[1]);
        var minor = parseInt(parts[2]);
        if (major > 1 || (major === 1 && minor > 0)) {
            throw new Error("This module is not required for Node-RED 1.1.0 or later")
        }
    }
    function GroupPolyfillNode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("group",GroupPolyfillNode);
}
