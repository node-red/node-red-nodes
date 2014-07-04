node-red-node-blinkstick
========================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://blinkstick.com/" target="_new">Blinkstick</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-blinkstick


Usage
-----

The BlinkStick output node expects a <b>msg.payload</b> with either a hex string #rrggbb triple or red,green,blue as three 0-255 values.


It can also accept <i><a href="http://www.w3schools.com/html/html_colornames.asp" target="_new">standard HTML colour</a></i> names.

<b>NOTE:</b> currently only works with a single BlinkStick. (As it uses the findFirst() function to attach).

For more info see the <i><a href="http://blinkstick.com/" target="_new">BlinkStick website</a></i> or the <i><a href="https://github.com/arvydas/blinkstick-node" target="_new">blinkstick npm</a></i> documentation.
