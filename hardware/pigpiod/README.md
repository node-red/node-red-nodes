node-red-node-pi-gpiod
======================

An alternative pair of <a href="http://nodered.org" target="_new">Node-RED</a> nodes to interact with Pi GPIO using
the <a href="http://abyz.me.uk/rpi/pigpio/pigpiod.html" target="_new">PiGPIOd</a> daemon that is now part of Raspbian.

The advantage is that it also talk to GPIO on a Pi that is remote as long as it is running the daemon, and also sharing pins works more cleanly as contention is handled by the multiple connections. This is also a
good way to access GPIO when running Docker on a Pi as you can use the network connection to link out of
the container to the PiGPIO daemon running on the host.

The disadvantage is that you must setup and run the PiGPIO daemon first.

## Requirements

PiGPIOd must be running on the pi. The easiest way to ensure this is to add the following line to your Pi `/etc/rc.local` file.

    /usr/bin/pigpiod

**Note**: By default this will expose the daemon on TCP port 8888, which is obviously a **security vulnerability**. If you don't want or need remote access then you can start it in local mode only, (`-l` option), or restrict permissions to certain ip addresses, (`-n {ipaddr}` option). For example:

    /usr/bin/pigpiod -l
    /usr/bin/pigpiod -n 192.168.1.10

See the <a href="http://abyz.me.uk/rpi/pigpio/pigpiod.html" target="new">instructions</a> for more details.

## Install

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-node-pi-gpiod

## Usage

**Note:** the pin numbers refer the physical pin numbers on connector P1 as they are easier to locate.</p>

### Input node

Generates a `msg.payload` with either a 0 or 1 depending on the state of the input pin.

##### Outputs

 - `msg.payload` - *number* - the level of the pin (0 or 1)
 - `msg.topic` - *string* - pi/{the pin number}

You may also enable the input pullup resistor &uarr; or the pulldown resistor &darr;.

### Output node

Can be used in Digital, PWM or Servo modes.

##### Input

 - `msg.payload` - *number | string*
  - Digital - 0, 1 - set pin low or high
  - PWM - 0 to 100 - level from 0 to 100%
  - Servo - 0 to 100, 50 is centred.

*Hint*: The `range` node can be used to scale inputs to the correct values.

Digital mode expects a `msg.payload` with either a 0 or 1 (or true or false),
and will set the selected physical pin high or low depending on the value passed in.

The initial value of the pin at deploy time can also be set to 0 or 1.

When using PWM and Servo modes, the input value should be a number 0 - 100, and can be floating point.

In servo mode you can also preset the minimum and maximum pulse times as required by your servo in order to reach its full range. Minimum of 5mS, maximum of 25 mS - defaults to 10 and 20 mS respectively.
