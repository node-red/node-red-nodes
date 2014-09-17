node-red-node-dweetio
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send and receive simple dweets.

This node does **NOT** support private dweets.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-dweetio


Usage
-----

###Output

Sends the **msg.payload** to Dweet.io


Optionally uses **msg.thing** to set the thing id, if not already set in the properties.

You need to make the thing id unique - you are recommended to use a GUID.

###Input

Listens for messages from Dweet.io

The thing id should be globally unique as they are all public - you are recommended to use a GUID.

The Thing ID is set into **msg.dweet**, and the timesamp into **msg.created**.


For further info see the <a href="https://dweetio.io/" target="_new">Dweet.io website</a
