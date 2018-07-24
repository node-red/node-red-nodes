node-red-node-ledborg
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="https://www.piborg.org/ledborg" target="_new">PiBorg LedBorg</a> board for a Raspberry Pi.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-ledborg


Usage
-----

A PiBorg LedBorg LED output node that expects a `msg.payload` with a three digit rgb triple, from <b>000</b> to <b>222</b>. I.E. there are only 27 possible colours.

See <i><a href="http://www.piborg.com/ledborg/install" target="_new">the PiBorg site</a></i> for more information.

You can also now use a `msg.payload` in the standard hex format "#rrggbb". The clip levels are :

><pre>0x00 - 0x57 = off<br/>0x58 - 0xA7 = 50%<br/>0xA8 - 0xFF = fully on</pre>

You can also use the @cheerlight colour names - red, amber, green, blue, cyan, magenta, yellow, orange, pink, purple, white, warmwhite, black

Notes
-----

This node can only be used once per flow... as it uses physical pins 11, 13 and 15 on the Pi.
Using it more than once will cause weird flashing and unpredictable behavior.

You can of course wire up multiple things in your flow to the same LEDborg node.
