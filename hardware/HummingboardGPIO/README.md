node-red-node-hbgpio
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to read and write the digital IO of a SolidRun HummingBoard.

Install
-------

**This install is for Debian based OS on Hummingboard.**

Run the following command in the root directory of your Node-RED install:

    npm install node-red-node-hpgpio

**Note :** This **should** be run as root in order to move and set SUID permissions on a script to talk to the gpio pins. Alternatively you can run as a normal user and then move the file and change permissions manually.

    sudo cp node_modules/node-red-node-hpgpio/gpiohb /usr/local/bin/
    sudo chmod 4755 /usr/lcoal/bin/gpiohb


Usage
-----

Hummingboard GPIO input and output nodes.

This requires a small script (gpiohb) to run as root in order to work. It should be placed in /usr/local/bin/ and have SUID permissions 4755.

**Note:** We are using the actual physical pin numbers as they are easier to locate.

###Output node

Expects a <b>msg.payload</b> with either a 0 or 1 (or true or false).

Will set the selected physical pin high or low depending on the value passed in.

The initial value of the pin at deploy time can also be set to 0 or 1.


###Input node

Generates a **msg.payload** with either a 0 or 1 depending on the state of the input pin.

The **msg.topic** is set to **pin/{the pin number}**

**Note:** The input node waits for a change on the level of the pin before reading the value - and then resets to wait for the next interrupt - so it is possible to miss very fast changes as we may still be reading the value when the second edge occurs.
