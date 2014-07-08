node-red-node-blink1
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://thingm.com/products/blink-1/" target="_new">Thingm Blink(1)</a> LED.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-blink1


Usage
-----

Sends the <b>msg.payload</b> to a Thingm Blink(1) LED device. The payload can be any of the following:

 - a three part csv string of r,g,b - e.g. red is  255,0,0
 - a hex colour #rrggbb - e.g. green is  #00FF00
 - a <a href="http://www.cheerlights.com/control-cheerlights">@cheerlights</a> colour name - e.g. blue

 The @cheerlights colours are - red, amber, green, blue, cyan, magenta, yellow, orange, pink, purple, white, warmwhite, black
