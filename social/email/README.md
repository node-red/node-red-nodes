node-red-node-email
===================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to send and receive simple emails.


Pre-requisite
-------------

You will need valid email credentials for your email server.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm i node-red-node-email

Usage
-----

Nodes to send and receive simple emails.

### Input

Repeatedly gets emails from an IMAP or POP3 server and forwards them onwards as messages if not already seen.

The subject is loaded into `msg.topic` and `msg.payload` is the plain text body.
If there is text/html then that is returned in `msg.html`. `msg.from` and
`msg.date` are also set if you need them.

Additionally `msg.header` contains the complete header object including
**to**, **cc** and other potentially useful properties.

**Note:** this node *only* gets the most recent single email from the inbox,
so set the repeat (polling) time appropriately.

Uses the *imap* npm module.

### Output

Sends the `msg.payload` as an email, with a subject of `msg.topic`.

The default message recipient can be configured in the node, if it is left
blank it should be set using the `msg.to` property of the incoming message.

You may optionally override the *from* email address by setting `msg.from`,
otherwise the node will use the `userid` setting from the server connection.

The payload can be html format.

If the payload is a binary buffer then it will be converted to an attachment.

The filename should be set using `msg.filename`. Optionally
`msg.description` can be added for the body text.

Alternatively you may provide `msg.attachments` which should contain an array of one or
more attachments in <a href="https://www.npmjs.com/package/nodemailer#attachments" target="_new">nodemailer</a> format.

Uses the *nodemailer* npm module.
