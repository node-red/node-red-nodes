node-red-node-pi-neopixel
=========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to drive a strip
of Neopixel or WS2812 LEDs.

Pre-requisites
--------------

The Unicorn HAT python drivers need to be pre-installed... This is the easiest way to get the neopixel driver installed... see the
<a "href=http://learn.pimoroni.com/tutorial/unicorn-hat/getting-started-with-unicorn-hat">
Pimorini Getting Started with Unicorn HAT</a> page.

    curl -sS get.pimoroni.com/unicornhat | bash

Install
-------

Run the following command in the root directory of your Node-RED install.
Usually this is `~/.node-red`

    npm install node-red-node-pi-neopixel

Usage
-----

Defaults to a bar chart style mode using configured foreground and background colours.

It can accept a number in **msg.payload** that can be either the number of pixels, or a percentage of the total length.

If you want to change the foregound colour, you can set **msg.payload** to a comma separated string of `html_colour,length`.

To set the background just set **msg.payload** `html_colour` name.
<a href="http://html-color-codes.info/color-names/" target="_top">Here
is a list</a> of html_colour names.

The `nth` pixel is set by **msg.payload** with a CSV string `n,r,g,b`

A range of pixels from `x` to `y` can be set by **msg.payload**
with a CSV string `x,y,r,g,b`

The pixels data line should be connected to Pi physical pin 12 - GPIO 18. *Note:* this may conflict with audio playback.
