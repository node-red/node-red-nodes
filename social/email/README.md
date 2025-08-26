node-red-node-email
===================

<a href="http://nodered.org" target="info">Node-RED</a> nodes to send and receive simple emails.

**v4 Breaking Change**

Version 4.x introduced a breaking change. Users of the email-mta node will have to re-enter any user/passwords used to authenticate incoming mail. This was caused by the existing property clashing with another internal users property. Apologies for the inconvenience.

**Notes** :
    Version 3.x of this node requires **Node.js v18** or newer.
    Version 2.x of this node requires **Node.js v16** or newer.
    Version 1.91 of this node required **Node.js v14** or newer.
    Previous versions of this node required **Node.js v8** or newer.

Pre-requisite
-------------

You will need valid email credentials for your email server. For GMail this may mean
getting an application password if you have two-factor authentication enabled.

For Exchange and Outlook 365 you must use OAuth2.0.

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

Office 365 users
----------------

If you are accessing Exchange you will need to register an application through their platform and use OAuth2.0.
<a target="_new" href="https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth#get-an-access-token">Details on how to do this can be found here.</a>

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

Modern authentication through OAuth2.0 is supported, but must be triggered by an incoming access token and
can only be automatically triggered upstream.

### Output node

Sends the `msg.payload` as an email, with a subject of `msg.topic`.

The default message recipient can be configured in the node, if it is left blank it should be set using the `msg.to` property of the incoming message. You can also specify any or all of: `msg.cc`, `msg.bcc`, `msg.replyTo`, `msg.inReplyTo`, `msg.references`, `msg.headers`, or `msg.priority` properties.


The email *from* can be set using `msg.from` but not all mail services allow
this unless `msg.from` is also a valid userid or email address associated with
the password. Note: if `userid` or msg.from does not contain a valid email
address (userxx@some_domain.com), you may see *(No Sender)* in the email.

The payload can be html format. You can also specify `msg.plaintext` if the main payload is html.

If the payload is a binary buffer, then it will be converted to an attachment.

The filename should be set using `msg.filename`. Optionally
`msg.description` can be added for the body text.

Alternatively you may provide `msg.attachments` which should contain an array of one or
more attachments in <a href="https://nodemailer.com/message/attachments/" target="_new">nodemailer</a> format.

If required by your recipient you may also pass in a `msg.envelope` object, typically containing extra from and to properties.

If you have own signed certificates, Nodemailer can complain about that and refuse sending the message. In this case you can try switching off TLS.

Use secure connection - If enabled the connection will use TLS when connecting to server. If disabled then TLS is used if server supports the STARTTLS extension. In most cases set this to enabled if you are connecting to port 465. For port 587 or 25 keep it disabled.

This node uses the *nodemailer* npm module.

Testing
-----

You can pass the credentials object to the `node-red-node-test-helper` by doing the following:

```js
const emailNode = require("./61-email");

const testFlows = [{
    id: "n1", type: "e-mail", name: "Email",
    from: "email1test@example.com", subject: "TestSubject", server: "testServer",
    port: "1111", secure: "X", tls: true, authtype: "BASIC",
}];

const testCredentials = {
    n1: {
        userid: "ExampleUser",
        password: "ExamplePassword",
        global: false
    }
};

it('should be loaded', function (done) {
    helper.load(emailNode, testFlows, testCredentials, function () {
        const n1 = helper.getNode("n1");
        try {
            n1.should.have.property('name', 'Email');
            n1.should.have.property('from', 'email1test@example.com');
            n1.should.have.property('subject', 'TestSubject');
            n1.should.have.property('outserver', 'testServer'); // Gathered via server
            n1.should.have.property('outport', '1111'); // Gathered via port
            n1.should.have.property('secure', 'X');
            n1.should.have.property('tls', true);
            n1.should.have.property('authtype', 'BASIC');
            n1.should.have.property('credentials');
            n1.should.have.property('credentials', {
                userid: "ExampleUser",
                password: "ExamplePassword",
                global: false
            });
            done();
        } catch (err) {
            done(err);
        }
    });
});
```
