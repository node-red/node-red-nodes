node-red-node-pi-neopixel
=========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to drive a strip
of Neopixel or WS2812 LEDs from a Raspberry Pi.

Pre-requisites
--------------

The Neopixel python driver need to be pre-installed... The easiest way to get
the driver installed is to use the Unicorn HAT drivers install script... see the
<a href="http://learn.pimoroni.com/tutorial/unicorn-hat/getting-started-with-unicorn-hat" target="_new">
Pimoroni Getting Started with Unicorn HAT</a> page.

    curl -sS get.pimoroni.com/unicornhat | bash

Install
-------

Run the following command in the root directory of your Node-RED install.
Usually this is `~/.node-red`

    npm install node-red-node-pi-neopixel

The data pin of the pixels should be connected to physical pin 12 - GPIO 18 of the Pi.
*Note:* this may conflict with audio playback.

Usage
-----

Defaults to a bar chart style mode using configured foreground and background colours.
It can also display a needle (single pixel) type gauge.

It can accept a number in **msg.payload** that can be either the number of pixels,
or a percentage of the total length.

If you want to change the foreground colour, you can set **msg.payload** to a
comma separated string of `html_colour,length` or `length,html_colour`

To set the background just set **msg.payload** to an `html_colour` name.
<a href="http://html-color-codes.info/color-names/" target="_top">Here
is a list</a> of html_colour names.

You can also select shift modes where a single colour pixel is added to either
the start or the end of the strip, shifting all the others along by one.

The `nth` pixel can be set by **msg.payload** with a CSV string `n,r,g,b` ,
where r, g and b are 0-255.

A range of pixels from `x` to `y` can be set by **msg.payload**
with a CSV string `x,y,r,g,b`
