node-red-node-pi-gpio
=====================

A set of <a href="http://nodered.org" target="_new">Node-RED</a> nodes to interact with Pi GPIO using the RPi.GPIO python library that is part of Raspbian.

It also include a simple node that detect mouse buttons and also keyboard clicks. Note: this
picks up mouse keys direct from the keyboard so should work even when the app does not have
focus, but YMMV.

If you need servo control then look at the
<a href="https://flows.nodered.org/node/node-red-node-pi-gpiod">node-red-node-pi-gpiod</a> node
as this is a lot more accurate timing wise, and more suitable for driving servos

## Install

Either use the Node-RED Menu - Manage Palette option to install, or run the following
command in your Node-RED user directory - typically `~/.node-red`

        npm i node-red-node-pi-gpio

The python library may also work with other distros running on a Pi (like Ubuntu or Debian) - you will need to install the PIGPIO package and run the following commands in order to gain full access to the GPIO pins as this ability is not part of the default distro. This is NOT necessary on Raspbian.

        sudo apt-get install python-pip python-dev
        sudo pip install RPi.GPIO  
        sudo addgroup gpio
        sudo chown root:gpio /dev/gpiomem
        sudo adduser $USER gpio
        echo 'KERNEL=="gpiomem", NAME="%k", GROUP="gpio", MODE="0660"' | sudo tee /etc/udev/rules.d/45-gpio.rules
        sudo udevadm control --reload-rules && sudo udevadm trigger

## Usage

**Note:** the pin numbers refer the physical pin numbers on connector P1 as they are easier to locate.

### Input node

Generates a `msg.payload` with either a 0 or 1 depending on the state of the input pin.

##### Outputs

 - `msg.payload` - *number* - the level of the pin (0 or 1)
 - `msg.topic` - *string* - pi/{the pin number}

You may also enable the input pullup resistor &uarr; or the pulldown resistor &darr;.

### Output node

Can be used in Digital or PWM modes.

##### Input

 - `msg.payload` - *number | string*
  - Digital - 0, 1 - set pin low or high. (Can also accept boolean `true/false`)
  - PWM - 0 to 100 - level from 0 to 100%

*Hint*: The `range` node can be used to scale inputs to the correct values.

Digital mode expects a `msg.payload` with either a 0 or 1 (or true or false),
and will set the selected physical pin high or low depending on the value passed in.

The initial value of the pin at deploy time can also be set to 0 or 1.

When using PWM mode, the input value should be a number 0 - 100, and can be floating point.
