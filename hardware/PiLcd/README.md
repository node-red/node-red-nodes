node-red-node-pilcd
===================

A <a href="http://nodered.org" target="_new">Node-RED</a> node for a Raspberry Pi
to write to a GPIO connected HD44780 style LCD panels.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-pilcd

Usage
-----

Raspberry Pi output to HD44780 style LCD module - typically 1, 2, or 4 lines.

It must be configured with a comma separated list of pins that are wired to the LCD panel.
Pins MUST be a comma separated list of the 6 GPIO connector
pin numbers that are connected to the RS, E, D4, D5, D6 and D7 pins of the LCD. e.g.

        26,24,22,18,16,12

Send the node a `msg.payload` with a string in it.

Strings for the 2nd line of the display must start **2:** - the third start **3:** - and the fourth **4:** - For example

        2:I'm on line two
        4:and this is on line 4
        1:or indeed line 1

The `1:` is not necessary for line one but is there if you build lines using a template,

To clear the display send the string `clr:`

It is up to you to manage string lengths to suit the display.

Requires the RPi.GPIO python library version 0.5.8 (or better) in order to work.

**Note:** we are using the actual physical pin numbers on connector P1 as they are easier to locate.
