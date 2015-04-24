node-red-node-pusher
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send and receive messages using Pusher.com.

Pre-requisites
--------------

You need a valid Pusher App key, secret and id from [http://pusher.com](http://pusher.com)

Install
-------

Run the following command in the root directory of your Node-RED install. this is usually ~/.node-red

        npm install node-red-node-pusher

Usage
-----

###Input

Pusher input mode. Use this node to subscribe to a Pusher channel/event.
You need a valid Pusher App key.

The node will set **msg.payload** to the message that arrives, and **msg.topic** to the eventname.

###Output

Pusher output node for sending messages to a specific channel/event.
You need an App key, secret and ID of a Pusher app.

The node will send the **msg.payload** of the incoming message.
