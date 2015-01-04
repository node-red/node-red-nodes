node-red-node-emoncms
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send energy data to <a href="http://emoncms.org" target="_new">emoncms.org</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-emoncms


Usage
-----

Emoncms post.

The **msg.payload** can contain either a comma separated list of name
value pairs, e.g.

        name:value,...

or a comma separated list of values, e.g.

        1,2,..


If Node is left blank **msg.nodegroup** will used.

Insertion time can be manipulated by setting **msg.time**.
