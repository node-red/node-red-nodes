node-red-node-ping
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to ping a remote server, for use as a keep-alive check.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-ping


Usage
-----

Pings a machine and returns the trip time in mS.

Returns boolean **false** if no response received within 5 seconds, or if the host is unresolveable.

Default ping is every 20 seconds but can be configured.
