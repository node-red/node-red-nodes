node-red-node-xmpp
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to talk to an XMPP server.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-xmpp


Usage
-----

Provides two nodes - one to send messages, and one to receive.

###Receive

Connects to an XMPP server to receive messages.</p>

The <b>Buddy</b> field is the id of the buddy or room you want to receive messages from.

Incoming messages will appear as <b>msg.payload</b> on the first output, while <b>msg.topic</b> will contain who it is from.

The second output will show the presence and status of a user in <b>msg.payload</b>. Again <b>msg.topic</b> will hold the user.

###Send

Connects to an XMPP server to send messages.

The <b>To</b> field is optional. If not set the <b>msg.topic</b> property of the message is used to set that value.

If you are joining a chat room then the <b>To</b> field must be filled in with the room name.

You may also send a msg with <b>msg.presence</b> to set your presence to one of

 1. chat
 2. away
 3. dnd
 4. xa

If you do so then the <b>msg.payload</b> is used to set your status message.</p>
