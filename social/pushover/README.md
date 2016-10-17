node-red-node-pushover
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://www.pushover.net/" target="_new">Pushover</a>.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-pushover


Usage
-----

Uses Pushover to push the `msg.payload` to a device that has the Pushover app installed.

Optionally uses `msg.topic` to set the title, `msg.device` to set the device
and `msg.priority` to set the priority, if not already set in the properties.

Optionally uses `msg.topic` to set the title, `msg.device` to set the device,
`msg.priority` to set the priority, `msg.url` to add a web address and `msg.url_title`
to add a url title - if not already set in the properties.

The User-key and API-token are stored in a separate credentials file.

Uses Pushover. See <a href="https://pushover.net" target="_new">Pushover.net</a> for more details.
