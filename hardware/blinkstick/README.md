node-red-node-blinkstick
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://www.blinkstick.com/" target="_new">BlinkStick</a>.

Pre-requisites
--------------

Depending on your operating system you may need to install some extra libraries before installing this node... I.E make sure it works outside of Node-RED first !

For more information see <i><a href="http://www.blinkstick.com/help/tutorials" target="_new">BlinkStick tutorials</a></i> or the <i><a href="https://github.com/arvydas/blinkstick-node" target="_new">node module</a></i> documentation.

#### Raspberry Pi / Debian / Ubuntu

    sudo apt-get install -y libudev-dev

You also currently need to create a file `/etc/udev/rules.d/80-blinkstick.rules` containing

    SUBSYSTEM=="usb", ATTRS{idVendor}=="20a0", ATTRS{idProduct}=="41e5", TAG+="uaccess"

and either reload the udev rules or reboot.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-blinkstick

Usage
-----

<i><a href="http://www.blinkstick.com" target="_new">BlinkStick</a></i> output node.
Expects a `msg.payload` with one of:

* A hex string <b>"#rrggbb"</b> triple
* <b>"red,green,blue"</b> three 0-255 values as a string
* <b>"random"</b> will generate a random color
* <i><a href="http://www.w3schools.com/html/html_colornames.asp" target="_new">Standard HTML color</a></i> name
* <b>object</b> can override any of the parameters

An object payload can override any of the settings on the node. Omitted parameters are left intact. For example:

    { 'color': 'blue' }
    { 'task': 'blink', 'color': 'red' }
    { 'task': 'pulse', 'color': 'green', 'duration': 500 }
    { 'task': 'morph', 'color': 'orange', 'duration': 500, 'steps': 20 }
