node-red-node-msgpack
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to pack and unpack objects to msgpack format buffers.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-msgpack

Changes
-------

Version 1.0.0 - move to msgpack-lite library (more supported and faster) - This uses the more
recent msgpack specification so please ensure all your endpoints are also using the latest spec.

Usage
-----

Uses the <a href="https://www.npmjs.org/package/msgpack-lite">msgpack-lite npm</a> to pack and unpack msg.payload objects to <a href="http://msgpack.org/">msgpack</a> format buffers.

**Note**: this node does not currently encode raw <code>buffer</code> types.
It will automatically try to *decode* any buffer received, and may not cause an error.

If the input is NOT a buffer it converts it into a msgpack buffer.

If the input is a msgpack buffer it converts it back to the original type.
