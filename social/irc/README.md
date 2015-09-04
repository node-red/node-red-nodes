node-red-node-irc
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to talk to an IRC server.

**Note** : This is the same node as was in the core of Node-RED.
As of v0.10.8 you will need to install it from here if still required.

Install
-------

Run the following command in the root directory of your Node-RED install, usually
this is ~/.node-red .

    npm install node-red-node-irc

During install there may be multiple messages about libiconv charset support.
These may look like failures... as they report as failure to compile errors -
but are warnings and the node will continue to install and, assuming nothing else
failed, you'll be able to use it, just without the character set features. You
may of course manually install the extra dependancies as per the warnings, but
they may not be available on all platforms.


Usage
-----

Provides two nodes - one to receive messages, and one to send.

###Input

Connects to an IRC server to receive messages.</p>

The **IRC Server** field needs to be configured to a valid server, and
you must select a default channel to join. You may join multiple channels by
comma separating a list - #chan1,#chan2,#etc.

Incoming messages will appear as **msg.payload** on the first output, while
**msg.topic** will contain who it is from. **msg.to** contains either the name of the channel or PRIV in the case of a pm.

The second output provides a **msg.payload** that has any status messages such as joins, parts, kicks etc.

The type of the status message is set as **msg.payload.type**. The possible status types are:

  - **message** : message is sent into the channel
  - **pm** : private message to the bot
  - **join** : a user joined the channel (also triggered when the bot joins a channel)
  - **invite** : the bot is being invited to a channel
  - **part** : a user leaves a channel
  - **quit** : a user quits a channe
  - **kick** : a user is kicked from a channel


###Output

Sends messages to a channel on an IRC server.

You can send just the **msg.payload**, or the complete **msg** object to the
selected channel, or you can select to use **msg.topic** to send the
**msg.payload** to a specific user (private message) or channel.

If multiple output channels are listed (eg. #chan1,#chan2), then the message
will be sent to all of them.

**Note:** you can only send to channels you have previously joined so they
MUST be specified in the node - even if you then decide to use a subset of them in msg.topic

You may send RAW commands using **msg.raw** - This must contain an array of
parameters - eg.

    ["privmsg","#nodered","Hello world"]
