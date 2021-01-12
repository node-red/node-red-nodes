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

This node sends readings from the various sensors on the Sense HAT, grouped into
three sets; motion events, environment events and joystick events.

#### Motion events

Motion events include readings from the accelerometer, gyroscope and magnetometer,
as well as the current compass heading. They are sent at a rate of approximately 10
per second. The `topic` is set to `motion` and the `payload` is an object with the
following values:

  - `acceleration.x/y/z` : the acceleration intensity in Gs
  - `gyroscope.x/y/z` : the rotational intensity in radians/s
  - `orientation.roll/pitch/yaw` : the angle of the axis in degrees
  - `compass` : the direction of North in degrees

#### Environment events

Environment events include readings from the temperature, humidity and pressure
sensors. They are sent at a rate of approximately 1 per second.  The `topic`
is set to `environment` and the `payload` is an object
with the following values:

  - `temperature` : degrees Celsius
  - `humidity` : percentage of relative humidity
  - `pressure` : Millibars

#### Joystick events

Joystick events are sent when the Sense HAT joystick is interacted with. The
`topic` is set to `joystick` and the `payload` is an object with the following values:

  - `key` : one of `UP`, `DOWN`, `LEFT`, `RIGHT`, `ENTER`
  - `state` : the state of the key:
    - `0` : the key has been released
    - `1` : the key has been pressed
    - `2` : the key is being held down


### Output Node

This node sends commands to the 8x8 LED display on the Sense HAT.

Commands are sent to the node in `msg.payload`. Multiple commands can
be sent in a single message by separating them with newline (\n) characters. 
You must use a function node or a change node (jsonata expression) when 
using the newline (\n) character to create a payload containing multiple commands.

#### Set the colour of individual pixels

Format: `<x>,<y>,<colour>`

`x` and `y` must either be a value from 0 to 7, a `*` to indicate the entire row
or column, or a range such as `3-6`.

`colour` must be one of:

  - the well-known <a href="https://en.wikipedia.org/wiki/Web_colors" target="_new">HTML colour names</a> - eg `red` or `aquamarine`,
  - the <a href="http://cheerlights.com/cheerlights-api/">CheerLights colour names</a>,
  - a HEX colour value - eg `#aa9900`
  - an RGB triple - `190,255,0`
  - or simply `off`

To set the entire screen to red: `*,*,red`

To set the four corners of the display to red, green (#00ff00), yellow and blue (0,0,255):

`0,0,red,0,7,#00ff00,7,7,yellow,7,0,0,0,255`

To set a 3-pixel wide column to purple: `4-6,*,purple`


#### Rotate the screen

Format: `R<angle>`

`angle` must be 0, 90, 180 or 270.

Example: `R180`

#### Flip the screen

Format: `F<axis>`

`axis` must be either `H` or `V` to flip on the horizontal or vertical axis respectively.

Example: `FV`

#### Scroll a message

If `msg.payload` is not recognised as any of the above commands, it is treated
as a text message to be scrolled across the screen.

If the text is a single character, it will be displayed without scrolling. To
scroll a single character, append a blank space after it - `"A "`.</p>

The following message properties can be used to customise the appearance:

  - `msg.color` - the colour of the text, default: `white`
  - `msg.background` - the colour of the background, default: `off`
  - `msg.speed` - the scroll speed. A value in the range 1 (slower) to 5 (faster), default: `3`

#### Set the screen brightness

Format: `D<level>`

`level` must be 0 (low) or 1 (high).

Example: `D1`
