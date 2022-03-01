node-red-node-junction
======================

A Node-RED node to allow flows containing junctions to be imported into older versions
of Node-RED.

The ability to create junctions was introduced in Node-RED 3.0.0, adding a new core
node type called `junction`.

This module provides its own `junction` node type that can be installed into older
versions of Node-RED to allow them to run flows containing that type.

The module will only register the type if it detects it is being loaded into
Node-RED version 2 or older, otherwise it does nothing.


Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-junction
