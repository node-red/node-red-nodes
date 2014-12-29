node-red-node-nma
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://www.notifymyandroid.com/" target="_new">Notify-My-Android</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-nma


Usage
-----

Uses Notify-My-Android (NMA) to push the **msg.payload** to an Android device that has Notify-My-Android app installed.

Optionally uses **msg.topic** to set the title, if not already set in the properties.

The API-key is stored in a separate credentials file.

Uses Notify-My-Android. See <a href="http://www.notifymyandroid.com/" target="_new">this link</a> for more details.</p>
