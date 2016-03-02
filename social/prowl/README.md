node-red-node-prowl
===================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://www.prowlapp.com/" target="_new">Prowl</a>.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-prowl


Usage
-----

Uses Prowl to push the `msg.payload` to an Apple device that has the prowl app installed.

Optionally uses `msg.topic` to set the title. You can also set `msg.priority` to configure the urgency from -2 (low), through 0 (normal) to 2 (urgent).

You may use `msg.url` to set a url to redirect the user to on receipt of the message if you don't set one in the edit dialogue.

Uses Prowl. See <a href="https://www.prowlapp.com" target="_new">this link</a> for more details.
