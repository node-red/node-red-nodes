node-red-node-piliter
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a Pimorini Pi-LITEr 8 LED add-on board for a Raspberry-Pi.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-piliter


Pre-reqs
--------

Requires the WiringPi gpio command to be installed in order to work. See the <a href="http://wiringpi.com" target="new">WiringPi site</a> for details on how to do this.


Usage
-----

Raspberry Pi-LITEr output node. The Pi-LITEr must be fitted.

Operates in one of 5 different modes :

 - Byte Mode - expects a value between 0 and 255, and each of the LEDs represent 1 bit.
 - Meter Mode - expects a value between 0 and 8, the led lit corresponds to the input value - like a meter needle.
 - Bar Mode - expects a value between 0 and 8, similar to meter - but all the leds up to the value are turned on - like a mini bar chart.
 - All LEDs Mode - expects a 1 or 0 - turns on and off ALL the LEDs
 - Object Mode - expects a object specifying the LED and state eg. <code>{led:3,state:0}</code> to set LED3 off.

Requires the WiringPi gpio command in order to work.
