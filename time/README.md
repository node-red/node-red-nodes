node-red-node-suncalc
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to provide a signal at sunrise and sunset.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-suncalc


Usage
-----

Uses the suncalc npm to generate an output at sunrise and sunset based on a specified location.

Several choices of definition of sunrise and sunset are available, see the <i><a href = "https://github.com/mourner/suncalc" target="_new">suncalc</a></i> module for details.

The node provide two outputs. The first output emits a <b>msg.payload</b> of <i>1</i> or <i>0</i> every minute depending if day-time (1) or night-time (0).

The second output emits only on the transition between night to day (<i>-> 1</i>) or day to night (<i>-> 0</i>).

It also sets the <b>msg.topic</b> to <i>sun</i> and <b>msg.moon</b> to the fraction of the moon currently visible (a value between 0 for no moon and 1 for full moon).</p>
