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

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-pi-neopixel

The data pin of the pixels should be connected to physical pin 12 - GPIO 18 of the Pi.
*Note:* this may conflict with audio playback.

Usage
-----

To set the background just set `msg.payload` to an `html_colour` name.
<a href="http://html-color-codes.info/color-names/" target="_top">Here
is a list</a> of html_colour names.

It also accepts a string triple `rrr,ggg,bbb` or `#rrggbb`

#### Bar Chart

Defaults style mode using configured foreground and background colours. The
foreground colour is used to indicate the number of pixels or length required.

It accepts a number in `msg.payload` that can be either the number of pixels,
or a percentage of the total length.

If you want to change the foreground colour, you can set `msg.payload` to a
comma separated string of `html_colour,length` or `length,html_colour`. The
foreground will then remain that colour until changed again.

#### Needle

It can also display a needle (single pixel) type gauge.
The rest of the pixels are set to the background colour on one side, and the foreground colour on the other side of the indicated pixel.

If you want to change the needle colour, you can set `msg.payload` to a
comma separated string of `html_colour,length` or `length,html_colour`.

#### Shift left and Shift right

You can also select shift modes where a single colour pixel is added to either
the start or the end of the strip, shifting all the others along by one. In this
mode the `msg.payload` can be specified as either an html colour name, an r,g,b triple or #rrggbb.

#### Low level "API"

The `nth` pixel of the string can be set by `msg.payload` with a CSV string `n,r,g,b` ,
where r, g and b are 0-255.

A range of pixels from position `x` to `y` can be set by `msg.payload`
with a CSV string `x,y,r,g,b`

#### Brightness

The overall brightness of the pixels can be set to a level in the 0-100 range (0 being off, 100 being full brightness).
It can also be set via `msg.brightness`
The default level is 100 (full brightness)

#### Gamma correction

The node uses gamma correction to display colours as naturally as possible.
This can be disabled if required. (e.g when working with low brightness levels) 

