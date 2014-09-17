node-red-node-msgpack
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to pack and unpack objects to msgpack format buffers.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-msgpack


Usage
-----

Uses the <a href="https://www.npmjs.org/package/msgpack">msgpack npm</a> to pack and unpack msg.payload objects to <a href="http://msgpack.org/">msgpack</a> format buffers.

If the input is an object it converts it to a msgpack buffer.

If the input is a msgpack buffer it converts it back to an object.

Current only supports msg.payloads of type object.
