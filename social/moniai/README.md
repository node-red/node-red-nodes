node-red-moniai
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that is triggered by a pattern on <a href="https://moni.ai" target="_new">Moni.ai</a>. Moni.ai is a virtual assistant for the Internet of Things.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-moniai


Usage
-----

Creates a new Voice Channel on Moni.ai

You need to signup as a user on <a href="https://moni.ai">https://moni.ai</a> in order to use the functionality.

After creating the node you can trigger the Voice Channel by saying the trigger pattern. You must be logged in to trigger the pattern (unless your Channel has been published).
When the Voice Channel gets triggered the node is sending <code>msg.payload</code> containing the userinput.,
while <code>msg.latitude</code> and <code>msg.longitude</code> will contain the gps coordinates of the user (if available).


