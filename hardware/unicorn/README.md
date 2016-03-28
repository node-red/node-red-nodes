node-red-node-pi-unicorn-hat
============================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to output to a
Raspberry Pi Unicorn HAT from Pimorini.

Pre-requisites
--------------

The Unicorn HAT python drivers need to be pre-installed... see the
<a href="http://learn.pimoroni.com/tutorial/unicorn-hat/getting-started-with-unicorn-hat" target="_new">
Pimoroni Getting Started with Unicorn HAT</a> page.

    curl -sS get.pimoroni.com/unicornhat | bash

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-pi-unicorn-hat

Usage
-----

The background of the array can be configured using an 8x8 pixel sized
png image, or by specifying a single colour using an r,g,b triple.

The brightness can also be set in the configuration. Defaults to 20% so as not
to blind you.

A pixel is set by a `payload` containing a CSV string `x,y,r,g,b` .
`x` and `y` can be a single pixel `0` to `7`, a range of pixels, eg `2-5`, or
`*` to indicate the whole line. Multiple pixels strings can also be sent as
`x1,y1,r1,g1,b1,x2,y2,r2,g2,b2,...` .

The background can also be set to a colour by setting `msg.payload` to an `r,g,b` triple.

Any msg with a `msg.topic` identifies a 'sprite', which can then be moved
independently of the background. A 'sprite' can be a single pixel, or a group of pixels.

Setting `msg.payload` to `0` will delete the sprite from the list identified by `msg.topic`.

Setting `msg.payload` to `DEL` delete any sprites - leaving the background.

Setting `msg.payload` to `CLS` will clear the display to off and delete any sprites.

The overall brightness may be set by setting `msg.payload` to `brightness,nn`, where `nn` is `0 to 100`.

The rotation may be set by setting `msg.payload` to `rotate,rr`, where `rr` is `0`, `90`, `180` or `270`.

Examples
--------

Includes two example flows - found under `Menu - Import - Examples - pi unicorn-hat`.
One shows drawing simple blocks and lines.
The other is a simple graphical clock that shows the current time in hours
and minutes using a number of coloured pixels.
