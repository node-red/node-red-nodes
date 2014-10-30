node-red-node-pibrella
======================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to control a <a href="http://pibrealla.com/" target="_new">Pibrella</a> add-on board for a Raspberry-Pi.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-pibrella


Pre-reqs
--------

Requires the WiringPi gpio command to be installed in order to work. See the <a href="http://wiringpi.com" target="new">WiringPi site</a> for details on how to do this.


Usage
-----

A pair of input and output Node-RED nodes for the Raspberry Pi Pibrella from Pimoroni.

###Output

The output node will set the selected output high (on) or low (off) depending on the value passed in. Expects a <b>msg.payload</b> with either a 0 or 1 (or true or false).

The Buzzer is a divider so low numbers are high notes. 0 is off, and the sensible lowest note is around 250-300. 2 is the highest note. 1 is just a buzz - so you can use 0/1 type inputs.

**Note:** Using the buzzer is known to "kill" audio output via the 3.5mm socket.

###Input

The input node generates a <b>msg.payload</b> with either a 0 or 1 depending on the state of the input pin.

The <b>msg.topic</b> is set to <i>pibrella/{the pin id}</i> - which will be A, B, C, D or R.

<b>Note:</b> This node currently polls the pin every 250mS. This is not ideal as it loads the cpu.
