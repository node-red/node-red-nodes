node-red-node-wol
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send Wake-On-LAN (WOL) magic packets.

Install
-------
Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-wol


Usage
-----

Sends a Wake-On-LAN magic packet to the mac address specified.

You may instead set `msg.mac` to dynamically set the target device mac to wake up.
