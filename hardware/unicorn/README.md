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

Run the following command in the root directory of your Node-RED install.
Usually this is `~/.node-red`

    npm install node-red-node-pi-unicorn-hat

Usage
-----

The background of the array can be configured using an 8x8 pixel sized
png image, or by specifying a single colour using an r,g,b triple.

The brightness can also be set in the configuration. Defaults to 20% so as not
to blind you.

A pixel is set by **msg.payload** with a CSV string `x,y,r,g,b` , where x and y
are 0 to 7, and r, g and b are 0 - 255.
If `x` or `y` are set to `*` then the complete row or column can be set.
Setting both `x` and `y` to `*` fills the background.

The background can also be set to a colour by setting **msg.payload** to an r,g,b triple.

Any msg with a **msg.topic** identifies a 'sprite' pixel, which can then be moved
independently of the background. A 'sprite' can be a single pixel or a complete line.

Setting **msg.payload** to `0` will delete the sprite from the list identified by **msg.topic**.

Setting **msg.payload** to `DEL` delete any sprites - leaving the background.

Setting **msg.payload** to `CLS` will clear the display to off and delete any sprites.

The overall brightness may be set by setting **msg.payload** to `brightness,nn`, where `nn` is 0 to 100.

The rotation may be set by setting ••msg.payload•• to 'rotate,rr', where 'rr' is 0, 90, 180 or 270.
