node-red-node-stomp
===================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to publish and subscribe to and from a <a href="https://stomp.github.io//" target="_new">Stomp</a> server.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-stomp


Usage
-----

Connects to a Stomp capable server to send and receive messages.

The **destination** field is optional. If set it overrides the **msg.topic** property of the message.

This node only uses the simple security version of the stomp-client.
