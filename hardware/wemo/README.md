node-red-node-wemo
==================

A pair of <a href="http://nodered.org" target="_new">Node-RED</a> nodes to control a <a href="http://www.belkin.com/uk/Products/home-automation/c/wemo-home-automation/" target="_new">Belkin Wemo</a> set of devices.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-wemo


Usage
-----

It doesn't yet do any ip address discovery of the wemo devices.

###Wemo output node.

Expects a **msg.payload** with either 1/0, on/off or true/false.


###Wemo input node.

Creates a **msg.payload** with either 1, 0, nc (no change), or na (not available).
