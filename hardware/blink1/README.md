node-red-node-blink1
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://thingm.com/products/blink-1/" target="_new">Thingm Blink(1)</a> LED.

Pre-requisites
--------------

As the blink1 is a USB HID device you may need some extra hardware libraries as
documented <a href="https://www.npmjs.com/package/node-blink1" target="_new">here</a>
and <a href="https://github.com/todbot/blink1/blob/master/linux/51-blink1.rules" target="_new">here</a>.

Specifically Ubuntu/Debian/Raspbian users may need to

    sudo apt-get install libusb-1.0-0-dev

and also setup these udev rules in `/etc/udev/rules.d/51-blink1.rules`

    SUBSYSTEM=="input", GROUP="input", MODE="0666"
    SUBSYSTEM=="usb", ATTRS{idVendor}=="27b8", ATTRS{idProduct}=="01ed", MODE:="666", GROUP="plugdev"

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-blink1

Usage
-----

Sends the `msg.payload` to a Thingm Blink(1) LED device. The payload can be any of the following:

 - a three part csv string of r,g,b - e.g. red is  255,0,0
 - a hex colour #rrggbb - e.g. green is  #00FF00
 - a <a href="http://www.cheerlights.com/control-cheerlights">@cheerlights</a> colour name - e.g. blue

 The colours it accepts are - red, amber, green, blue, cyan, magenta, yellow, orange, pink, purple, white, warmwhite (or oldlace), black, (and off)
