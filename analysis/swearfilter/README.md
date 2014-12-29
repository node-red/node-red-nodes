node-red-node-badwords
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that attempts to filter out messages containing swearwords.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-badwords


Usage
-----

Uses the badwords npm to attempt to filter out messages containing swearwords.

Analyses the **msg.payload** and tries to filter out any messages containing bad swear words. If the payload contains a bad word then the whole message is blocked.

**Note** : this only operates on payloads of type <b>string</b>. Everything else is blocked.
