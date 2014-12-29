node-red-node-pushbullet
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://pushbullet.com" target="_new">Pushbullet</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-pushbullet


Usage
-----

Uses PushBullet to push the <b>msg.payload</b> to a device that has the PushBullet app installed.

Optionally uses <b>msg.topic</b> to set the title, if not already set in the properties.

You need to configure both your <i>API key</i> and the target <i>device ID</i>. The device ID may be passed in as <b>msg.deviceid</b>. You can set these per node in the edit dialog.
