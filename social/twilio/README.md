node-red-node-twilio
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send SMS messages via the <a href="http://twilio.com" target="_new">Twilio</a> service.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-twilio


Usage
-----

Sends an SMS message or make a voice call using the Twilio service.

The Twilio out node is configured to send SMS or make call, depending on the option selected you
enter the phone number or phone number and a URL to create the TWiML response file.

`msg.payload` is used as the body of the message. The node can be configured with the number
to send the message to. Alternatively, if the number is left blank, it can be set using `msg.topic`.
The payload can also be the URL to create the TWiML response file.

You must have an account with Twilio to use this node. You can register for one <a href="https://www.twilio.com/">here</a>.

There is an example of using this node to create a simple IVR <a href="http://flows.nodered.org/flow/637b5f6128a8d423503f" target="_new">here</a>.
