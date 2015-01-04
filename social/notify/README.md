node-red-node-prowl
===================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send local popup notifications.

Uses [Growl](http://growl.info//)

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-notify

Uses Growl so should work cross platform but will need **pre-reqs** installed...
see <a href="https://npmjs.org/package/growl" target="_new">this link</a> for detailed instructions.

If installing on Windows you MUST read the install instructions ... especially the bit about adding growlnotify to your path... or it WILL NOT work.


Usage
-----

Uses Growl to push the **msg.payload** to the local desktop.

The title can be set by **msg.topic**.
