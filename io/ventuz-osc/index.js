/**
 * node-red-contrib-ventuz-osc
 * Node-RED nodes for Ventuz OSC communication
 */

module.exports = function(RED) {
    RED.nodes.registerType("osc-out", require("./nodes/osc-out"));
    RED.nodes.registerType("osc-in", require("./nodes/osc-in"));
};
