node-red-node-digirgb
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://digistump.com/products/3" target="_new">Digispark RGB</a> LED.

Install
-------

Run the following command in the home directory of your Node-RED install.
This is usually `~/.node-red`

    npm install node-red-node-digirgb


Usage
-----

Simple output node to drive a Digispark RGB LED.

Requires a <b>msg.payload</b> to be of the form 'r,g,b' - for example 255,0,0  for red.
