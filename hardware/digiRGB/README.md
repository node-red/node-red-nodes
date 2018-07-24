node-red-node-digirgb
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://digistump.com/products/3" target="_new">Digispark RGB</a> LED.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-digirgb


Usage
-----

Simple output node to drive a Digispark RGB LED.

Requires a `msg.payload` to be of the form 'r,g,b' - for example 255,0,0  for red.
