node-red-node-toon
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to encode and decode objects to TOON format strings.


Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-toon

Usage
-----

A function that converts the `msg.payload` object to and from TOON format.

If the input is an object it converts it to a TOON encoded string.

If the input is a TOON encoded string it tries to convert it back to an object.
