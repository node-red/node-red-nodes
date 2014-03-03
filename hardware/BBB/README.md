# BBB-hardware

Node-RED nodes for interfacing with hardware inputs and outputs on the BeagleBone Black.
Uses the bonescript library provided with the BBB, available through NPM and on Github
at <https://github.com/jadonk/bonescript>

## Installation and Requirements

The BBB should be running with the as-supplied device tree compiled into the kernel. This
code is not currently aware of dynamically loaded device tree overlays, and in particular
the list of pins presented for each node is based on the default. You might be lucky though...

You need to be root to use bonescript, an error message will be logged if you are not.

This code has been tested with the latest node-RED from github as of 2014-02-27T20:00
using bonescript 0.2.4 running under node v0.8.22 on Angström
Linux 3.8.13. The BBB was reflashed with the 2013.09.04 image, updated using opkg upgrade.

Note that you do not need to add bonescript to node-RED's global context (in settings.js) to
use these nodes, but no harm should arise if you do.

Currently there are no checks against assigning the same pin to multiple nodes. Don't do it!

## Available Nodes

More nodes will be added as time is available, but the list at present is:

### analogue-in

Uses the on-chip ADC to measure a voltage between 0V and +1.8V on any one of the 7
dedicated input pins. A message input is used to trigger an ADC conversion, or
alternatively a single message can trigger a rapid 'burst' of 10 conversions
which are averaged together to reduce the noise (which can be a problem, especially
with high source impedances).

Linear scaling can be applied to the measurement result. Linearity correction can
be applied using a piecewise-linear approach, useful for linearising transducers such
as thermistors or LDRs.

Useful for conversion rates up to about 50 samples/sec.

### discrete-in

Reads a GPIO pin, and generates a message when it changes state: either in both
directions or just rising or just falling edges only. A debounce algorithm may be
applied, useful if the input is connected to a pushbutton.

One pin state is denoted as 'active', and the node accumulates the total time in this
state. A message with this total is output periodically, controlled by an internal
timer. The total can be cleared or set to an arbitrary value by an input message
who's topic copntains 'load'.

Useful for energy monitoring, e.g. logging boiler on time.

### pulse-in

Counts input pulses at a GPIO pin. The count can be advanced by either the rising edge
of the pulse, or by both edges. Two outputs are provided:

1. The current total number of pulses
2. The current pulse rate (pulses/second)

Separate scaling factors are applied to each output. Output messages are generated
at regular intervals, controlled by an internal timer. The count can be cleared
or set to an arbitrary value by an input message who's topic contains 'load'.
Useful for energy monitoring, e.g. electricty meter pulse outputs.

The 'instantaneous' pulse rate is derived from either the time between the last two
pulses, or the time since the last pulse, whichever is larger. This gives a rapid
dynamic response to changes in electricty use, for example.

Recommended maximum pulse rate 20 pulses/second - but it did work OK at 500 Hz!

### discrete-out

Sets a GPIO pin to the state specified by the input message payload: 0/1 or true/false.
The pin can either follow the input state or be an inverted copy. Alternatively, in toggle
mode each input message (whatever its topic & payload) will toggle the pin between
the two states.

You can specify the state to be set at startup, prior to the arrival of the first message.

The node generates an output message with payload 1 or 0 each time it changes state.
The user LEDs are available to the discrete-out node

### pulse-out

Pulses a GPIO pin when a message arrives. The pulse time is set in the property editor,
but can be overridden by a time value in an input message (topic containing 'time').

The can be set to generate high pulses (normally low) or vice-versa. It may also be 
set as retriggerable or not.

The node generates an output message with payload 1 or 0 each time it changes state.
The user LEDs are available to the pulse-out node

## Author

BBB-hardware was written by

* Max Hadley [@MRHadley](http://twitter.com/MRHadley)

## Copyright and license

Copyright 2014 M R Hadley, made available under [the Apache 2.0 license](LICENSE).
