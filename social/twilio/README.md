node-red-node-twilio
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send SMS messages via the <a href="http://twilio.com" target="_new">Twilio</a> service.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-twilio


Usage
-----

Sends an SMS message using the Twilio service.

<b>msg.payload</b> is used as the body of the message. The node can be configured with the number
    to send the message to. Alternatively, if the number is left blank, it can be set using <b>msg.topic</b>.

You must have an account with Twilio to use this node. You can register for one <a href="https://www.twilio.com/">here</a>.

There is an example of using this node to create a simple IVR <a href="http://flows.nodered.org/flow/637b5f6128a8d423503f" target="_new">here</a>.
