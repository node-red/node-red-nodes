node-red-node-stomp
===================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to publish and subscribe to and from a <a href="https://stomp.github.io//" target="_new">Stomp</a> server.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-stomp


Usage
-----

Connects to a Stomp capable server to send and receive messages.

The **destination** field is optional. If set it overrides the `msg.topic`
property of the message.

As noted [here](https://github.com/easternbloc/node-stomp-client#queue-names),
while not a requirement of the Stomp protocol,
if talking to an **ActiveMQ** server the *destination* should begin with
**"/queue/"** or with **"/topic/"**.

This node only uses the simple security version of the stomp-client.
