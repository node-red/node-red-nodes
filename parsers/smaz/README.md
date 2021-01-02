node-red-node-smaz
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to pack and unpack strings to smaz format buffers.

Install
-------

Either use the Manage Palette option in the Node-RED Editor menu, or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-smaz

Usage
-----

Uses a <a href="https://github.com/antirez/smaz">smaz</a> library to pack and unpack short strings to small buffers.

**Note**: this node ONLY accepts strings - anything else will just be dropped.

If the input is a string it converts it into a smaz buffer.

If the input is a smaz buffer it converts it back to the original string.
