node-red-node-group
===================

A Node-RED node to allow flows containing groups to be imported into older versions
of Node-RED.

The ability to create groups was introduced in Node-RED 1.1.0, adding a new core
node type called `group`.

This module provides its own `group` node type that can be installed into older
versions of Node-RED to allow them to run flows containing that type.

It does *not* provide any group-like functionality - it *only* registers a
placeholder `group` node type.

The module will only register the type if it detects it is being loaded into
Node-RED 1.0.x or older, otherwise it does nothing.


Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-group
