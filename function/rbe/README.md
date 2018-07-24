node-red-node-rbe
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that provides
provides report-by-exception (RBE) and deadband capability.

The node blocks unless the incoming value changes - RBE mode, or
changes by more than a certain amount (absolute value or percentage) - deadband
mode.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-rbe


Usage
-----

A simple node to provide report by exception (RBE) and deadband function
- only passes on data if it has changed.

This works on a per `msg.topic` basis. This means that a single rbe node can
handle multiple topics at the same time.

### RBE mode

The node doesn't send any output until the `msg.payload` is different to the previous one.
Works on numbers and strings. Useful for filtering out repeated messages of the
same value. Saves bandwidth, etc...

### Deadband modes

In deadband mode the incoming payload should contain a parseable *number* and is
output only if greater than + or - the *band gap* away from the previous output.
It can also be set to block values more than a certain distance away from the present value.
This can be used to remove outliers or unexpected readings.

You can specify compare with *previous valid output value* or *previous input value*.
The former ignores any values outside the valid range, whereas the latter allows
two "bad" readings in a row to reset the range based on those values.
For example a valid step change.

The deadband value can be specified as a fixed number, or a percentage. E.g. 10
or 5% . If % mode is used then the output will only get sent if the input payload
value is equal or more than the specified % away from the previously sent value.

For example - if last sent value was 100, and deadband is set to 10% - a value
of 110 will pass - then the next value has to be 121 in order to pass (= 110 + 10% = 121).

This is mainly useful if you want to operate across multiple topics at the same
time that may have widely differing input ranges.

Will only accept numbers, or parseable strings like  "18.4 C"  or "$500"
