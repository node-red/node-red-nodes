node-red-node-rbe
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that provides
provides report-by-exception (RBE) and deadband capability.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-rbe


Usage
-----

A simple node to provide report by exception (RBE) and deadband function
- only passes on data if it has changed.

###RBE mode

Outputs the **msg** if the **msg.payload** is different to the previous one.
Works on numbers and strings. Useful for filtering out repeated messages of the
same value. Saves bandwidth, etc...

###Deadband mode

In deadband mode the incoming payload should contain a parseable *number* and is
output only if greater than + or - the *band gap* away from the previous output.

Will accept numbers, or parseable strings like  "18.4 C"  or "$500"
