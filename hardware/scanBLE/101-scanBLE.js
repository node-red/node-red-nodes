
module.exports = function(RED) {
    "use strict";

    //import noble
    var noble = require('noble');

    // The main node definition - most things happen in here
    function BleScan(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        var msg = {};
        var ble_name;
        var node = this;

        //get name and uuid from user
        this.ble_name = n.ble_name;
        this.ble_uuid = n.ble_uuid;

        this.on("input", function(msg) {
            noble.startScanning();
        });

        noble.on('scanStart', function(msg) {
            msg = {};
            msg.topic = node.topic;
            msg.payload = "Scanning initiated..." //debugging
            //console.log('scanning initiated...');
            node.send(msg);
        });

        noble.on('discover', function(peripheral) {
            var msg = {};
            msg.topic = node.topic;
            msg.payload = "not found";

            //check for the device name and the UUID (first one from the UUID list)
            if (peripheral.advertisement.localName==node.ble_name && peripheral.advertisement.serviceUuids[0]==node.ble_uuid) {
                msg.payload=peripheral.advertisement.localName;
                noble.stopScanning();
            }
            node.send(msg);
        });

        this.on("close", function() {
            try { noble.stopScanning(); }
            catch (err) { console.log(err); }
        });
    }
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("scanBLE", BleScan);
}
