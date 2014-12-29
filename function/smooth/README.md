node-red-node-smooth
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that provides several simple smoothing algorithms for incoming data values.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-smooth


Usage
-----

A simple node to provide various functions across several previous values, including max, min, mean, high and low pass filters.

Max, Min and Mean work over a specified number of previous values.

The High and Low pass filters use a smoothing factor. The higher the number the more the smoothing. E.g. a value of 10 is similar to an &alpha; of 0.1. It is analogous to an RC time constant - but there is no time component to this as the code is based on events arriving.


**Note:** This only operates on **numbers**. Anything else will try to be made into a number and rejected if that fails.
