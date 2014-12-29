node-red-node-beaglebone
========================
A set of <a href="http://nodered.org" target="_new">Node-RED</a> nodes to interface with the GPIO pins of a <a href="http://http://beagleboard.org/black/" target="_new">Beaglebone Black</a>.

Pre-requisites
--------------

Only of use on a BeagleboneBlack board. Should ideally be running the <a href="http://beagleboard.org/latest-images/" target="_new"> latest Debian</a> image - as that has node.js v0.10.x and the bonescript npm preinstalled.
it does also need <b>bonescript</b> - but this is also pre-installed so no need to mark as a dependency...

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-beaglebone

v0.4 now also supports <a href="http://octalbonejs.com/" target="_new">OctaBoneScript</a> if installed.


Usage
-----

This package provides 5 nodes for use with the BeagleboneBlack board.

###Analogue Input

Reads an analogue pin when triggered by
a message.

The output message topic is the node topic: the output message value is the
scaled analogue input or NaN if a read error occurs.


Simple linear scaling is defined by setting the output values required for input
values of 0 and 1. You can apply more complicated scaling, e.g. for sensor linearisation,
by defining breakpoints at intermediate input values, with the desired output for
each. Values between breakpoints are linearly interpolated.


To reduce the effect of noise, enable averaging. This will read the input pin
voltage ten times in rapid succession for each input message and output the mean value.

###Digital Input

Sends a message with payload 0 or 1 on the first output when the pin changes state, and logs the total time in the active state.

Sends a message with a payload of the current total active time
(in seconds) on the second output at selectable intervals. An input message with topic 'load'
and a numeric payload will set the total active time to that value: any other input message
will reset it to zero.

The active state may be set to be high or low: this only affects the calculation
of the active time, not the pin state value sent on the first output.

The pin state messages may be generated for both directions of change, or for just 0 to 1
or just 1 to 0 changes. This is useful to generate a single message from a button
press. When using buttons or switches, enable debouncing to improve reliability.

###Pulse Input

Pulse input for the Beaglebone Black. Counts input pulses or pulse edges: outputs
total counts and the rate of counts/sec, with scaling.

Sends the total count message on the first output, and the current count
rate message on the second output, at the chosen interval. An input message with topic 'load'
and a numeric payload will set the total count to that value (no scaling is applied):
any other input message will reset it to zero.

###Digital Output

Sets the output pin high or low depending on the payload of the input message. Numeric
payloads > 0.5 are 'high' (1), payloads <= 0.5 are 'low' (0). Other payloads which
evaluate to true are 'high', if not then 'low'. Selecting the Inverting checkbox will
switch the sense of the pin output.


If the Toggle state checkbox is checked, the message content is ignored: successive
messages cause the pin to toggle between 0 and 1.


The pin will be initially set to the given Startup state until the first message arrives:
the Inverting property is not applied to this value.

###Pulse Output

Pulses the output pin for the set time after receiving an input message, unless the
message has a topic including the text 'time' and a numeric payload. In this case, the
the pulse time will be the value of the payload in seconds. If the time from either
source is < 0.001 seconds, no pulse is generated.

In retriggerable mode, a second message within the pulse period will extend the duration
of the pulse by the time value: in non-retriggerable mode, input messages arriving during
the duration of the pulse are ignored.

The pin state of the pulse may be set to either 0 or 1: the output pin will switch
back to the other state after the pulse time. An output message is generated each time
the pin changes state: its payload is the new state (0 or 1).
