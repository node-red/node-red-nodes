node-red-node-intel-gpio
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to talk to an Intel
Galileo or Edison running mraa.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm i node-red-node-intel-gpio

Usage
-----

The Galileo or Edison must already be running Linux, and have Node-RED installed.

See the [Intel Downloads](https://software.intel.com/en-us/iot/home) for
hardware / downloads for your particular board.

Ensure the latest version of mraa libraries are installed: (version 1.5 as of Sept 2015)

        echo "src mraa-upm http://iotdk.intel.com/repos/1.5/intelgalactic" > /etc/opkg/mraa-upm.conf
        opkg update
        opkg upgrade

**NOTE** : This node assumes that the mraa npm is already installed globally - as
it is on the Galileo and Edison boards.

If you do need to install Node-RED, you can do this as follows from the home directory of the root user

        npm install -g --unsafe-perm node-red
        mkdir .node-red
        cd .node-red
        npm install node-red-node-intel-gpio

### Analogue Input Node

Monitors the selected pin for changes. It outputs on a change of value.
As analogue inputs are continuously changing you can set the sample rate in ms from 20 to 65535.

### Digital Input Node

Monitors the selected pin for changes. It only outputs on a change of value.

### Digital Output Node

Sets the selected digital pin output high or low depending on the value of
`msg.payload` - expects a number or string 0 or 1.

### Pulse Width Modulation (PWM) Node

The `msg.payload` should contain a floating point number value
between 0 (off) and 1 (fully on), or a string representation thereof.

You can set the overall period (mS) in the edit dialogue.

For servo control set the period to 20mS and vary the input between 0.05 and 0.10,

        0.05 = 5% of 20mS = 1mS
        0.75 = 7.5% of 20mS = 1.5mS - typical servo centre point
        0.10 = 10% of 20mS = 2mS

### Example

Simple flow to blink Pin 13

...tbd
