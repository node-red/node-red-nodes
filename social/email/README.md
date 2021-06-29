node-red-node-email
===================

<a href="http://nodered.org" target="info">Node-RED</a> nodes to send and receive simple emails.

Pre-requisite
-------------

You will need valid email credentials for your email server. For GMail this may mean
getting an application password if you have two-factor authentication enabled.

**Note :** Version 1.x of this node requires **Node.js v8** or newer.

Install
-------

You can install by using the `Menu - Manage Palette` option, or running the following command in your
Node-RED user directory - typically `~/.node-red`

        cd ~/.node-red
        npm i node-red-node-email

GMail users
-----------

If you are accessing GMail you may need to either enable <a target="_new" href="https://support.google.com/mail/answer/185833?hl=en">an application password</a>,
or enable <a target="_new" href="https://support.google.com/accounts/answer/6010255?hl=en">less secure access</a> via your Google account settings.</p>

Usage
-----

Nodes to send and receive simple emails.

### Input node

Fetches emails from an IMAP or POP3 server and forwards them onwards as messages if not already seen.

The subject is loaded into `msg.topic` and `msg.payload` is the plain text body.
If there is text/html then that is returned in `msg.html`. `msg.from` and
`msg.date` are also set if you need them.

Additionally `msg.header` contains the complete header object including
**to**, **cc** and other potentially useful properties.

### Output node

Sends the `msg.payload` as an email, with a subject of `msg.topic`.

The default message recipient can be configured in the node, if it is left
blank it should be set using the `msg.to` property of the incoming message.

The email *from* can be set using `msg.from` but not all mail services allow
this unless `msg.from` is also a valid userid or email address associated with
the password. Note: if `userid` or msg.from does not contain a valid email
address (userxx@some_domain.com), you may see *(No Sender)* in the email.

The payload can be html format. You can also specify `msg.plaintext` if the main payload is html.

If the payload is a binary buffer then it will be converted to an attachment.

The filename should be set using `msg.filename`. Optionally
`msg.description` can be added for the body text.

Alternatively you may provide `msg.attachments` which should contain an array of one or
more attachments in <a href="https://nodemailer.com/message/attachments/" target="_new">nodemailer</a> format.

Uses the *nodemailer* npm module.
