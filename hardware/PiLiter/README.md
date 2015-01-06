node-red-node-piliter
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a Pimorini Pi-LITEr 8 LED add-on board for a Raspberry-Pi.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-piliter


Pre-reqs
--------

Requires the python RPi.GPIO library v0.58 (or better) to be installed in order to work.
See the <a href="http://sourceforge.net/p/raspberry-gpio-python/wiki/install/" target="new">RPi.GPIO site</a> for details on how to do this.

This is built into most recent Raspbian versions so no install should be necessary - but if necessary

    $ sudo apt-get update
    $ sudo apt-get install python-rpi.gpio python3-rpi.gpio

Usage
-----

Raspberry Pi-LITEr output node. The Pi-LITEr must be fitted.

Operates in one of 5 different modes :

 - Byte Mode - expects a value between 0 and 255, and each of the LEDs represent 1 bit.
 - Meter Mode - expects a value between 0 and 8, the led lit corresponds to the input value - like a meter needle.
 - Bar Mode - expects a value between 0 and 8, similar to meter - but all the leds up to the value are turned on - like a mini bar chart.
 - All LEDs Mode - expects a 1 or 0 - turns on and off ALL the LEDs
 - Object Mode - expects a object specifying the LED and state eg. <code>{led:3,state:0}</code> to set LED3 off.

Requires the RPi.GPIO library installed in order to work.

In order to access the GPIO the nrgpio.py command (installed as part of this package) must be run as root (sudo).
The default Pi user can do this so it "should just work" - however if you are running Node-RED as not the Pi user then
you may need to give your user sudo rights - or specifically sudo rights to python.
