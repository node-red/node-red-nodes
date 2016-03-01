node-red-node-pi-sense-hat
==========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to interact with
a Raspberry Pi Sense HAT.

## Pre-requisites

The Sense HAT python drivers need to be installed manually:

```
sudo apt-get update
sudo apt-get install sense-hat
sudo pip-3.2 install pillow
```

See the <a href="http://pythonhosted.org/sense-hat/" target="_new">driver documentation</a>
for more information.


## Install

Run the following command in your Node-RED user directory (typically `~/.node-red`):

    npm install node-red-node-pi-sense-hat

## Usage

### Input Node

This node sends readings from the various sensors on the Sense HAT, grouped into three sets; motion events, environment events and joystick events.

#### Motion events

Motion events include readings from the accelerometer, gyroscope and magnetometer,
as well as the current compass heading. They are sent at a rate of approximately 10
per second. The `topic` is set to `motion` and the `payload` is an object with the
following values:

  - `acceleration.x/y/z` : the acceleration intensity in Gs
  -`gyroscope.x/y/z` : the rotational intensity in radians/s
  -`orientation.roll/pitch/yaw` : the angle of the axis in degrees
  -`compass` : the direction of North in degrees

#### Environment events

Environment events include readings from the temperature, humidity and pressure
sensors. They are sent at a rate of approximately 1 per second.  The `topic`
is set to `environment` and the `payload` is an object
with the following values:

  -`temperature` : degrees Celsius
  -`humidity` : percentage of relative humidity
  -`pressure` : Millibars

#### Joystick events

Joystick events are sent when the Sense HAT joystick is interacted with. The
`topic` is set to `joystick` and the `payload` is an object with the following values:

  -`key` : one of `UP`, `DOWN`, `LEFT`, `RIGHT`, `ENTER`
  -`state` : the state of the key:
    -`0` : the key has been released
    -`1` : the key has been pressed
    -`2` : the key is being held down
