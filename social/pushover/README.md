node-red-node-pushover
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://www.pushover.net/" target="_new">Pushover</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-pushover


Usage
-----

Uses Pushover to push the <b>msg.payload</b> to a device that has the Pushover app installed.

Optionally uses **msg.topic** to set the title, and **msg.priority** to set the priority, if not already set in the properties.

The User-key and API-token are stored in a separate credentials file.

Uses Pushover. See <a href="https://pushover.net" target="_new">Pushover.net</a> for more details.
