node-red-node-xmpp
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to talk to an XMPP server.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-xmpp


Usage
-----

Provides two nodes - one to send messages, and one to receive.

### Receive

Connects to an XMPP server to receive messages.</p>

The **Buddy** field is the id of the buddy or room you want to receive messages from.

Incoming messages will appear as `msg.payload` on the first output, while `msg.topic` will contain who it is from.

The second output will show the presence and status of a user in `msg.payload`.
Again `msg.topic` will hold the user.

### Send

Connects to an XMPP server to send messages.

The **To** field is optional. If not set the `msg.topic` property of the message is used to set that value.

If you are joining a chat room then the **To** field must be filled in with the room name.

You may also send a msg with `msg.presence` to set your presence to one of

 1. chat
 2. away
 3. dnd
 4. xa

If you do this then the `msg.payload` is used to set your status message.
