node-red-node-pibrella
======================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://pibrealla.com/" target="_new">Pibrella</a> add-on board for a Raspberry-Pi.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-pibrella


Pre-reqs
--------

Requires the RPi.PIO python library version 0.5.8 (or better) in order to work. See the <a href="https://pypi.python.org/pypi/RPi.GPIO" target="new">RPi.GPIO site</a> for mode details.

    sudo apt-get -y install python-rpi.gpio

Usage
-----

A pair of input and output Node-RED nodes for the Raspberry Pi Pibrella from Pimoroni.

###Output

The output node will set the selected output high (on) or low (off) depending on the value passed in. Expects a <b>msg.payload</b> with either a 0 or 1 (or true or false).

You may also select PWM mode to dim the on board LEDs if you wish. Expects a value from 0 to 100.

The Buzzer expects a number representing the frequency in Hz. 0 is off and 1 is a tone - so you can use 0/1 type inputs as well.

###Input

The input node generates a <b>msg.payload</b> with either a 0 or 1 depending on the state of the input pin.

The <b>msg.topic</b> is set to <i>pibrella/{the pin id}</i> - which will be A, B, C, D or R.
