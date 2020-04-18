node-red-node-suncalc
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to provide a signal at sunrise and sunset.

Install
-------

Either use the `Node-RED Menu - Manage Palette - Install`, or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-suncalc

Usage
-----

Uses the suncalc npm to generate an output at sunrise and sunset based on a specified location.

Several choices of definition of sunrise and sunset are available, see the
<i><a href = "https://github.com/mourner/suncalc" target="_new">suncalc</a></i> module for details.

The start and end times can be offset by a number of minutes before (minus) or after (plus) the chosen event time.

The node provide two outputs. The first output emits a `msg.payload` of <i>1</i> or <i>0</i> every minute
depending if day-time (1) or night-time (0).

The second output emits only on the transition between night to day (<i>-> 1</i>) or day to night (<i>-> 0</i>).

It also outputs <code>msg.start</code>, <code>msg.end</code> and <code>msg.now</code> which are todays start and end times, with offsets applied, in ISO format, and the current ISO time.

The `msg.topic` is set to <i>sun</i>, and `msg.moon` to the fraction of the moon currently visible
(a value between 0 for no moon and 1 for full moon).</p>
