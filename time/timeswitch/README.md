node-red-node-timeswitch
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to provide a
simple timeswitch node to schedule daily on/off events.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-node-timeswitch

Usage
-----

Sets `msg.payload` to *1* during on times, and *0* during off times.

Also uses the suncalc module to allow use of dawn and dusk.

Dawn and dusk times can be offset both positively (+ve) for minutes after dawn
or dusk, and negatively (-ve) for minutes before dawn or dusk..

The output emits a `msg.payload` of *1* or *0* every minute depending on
whether the current time is during the selected on time or off time.

If you just need the transitions from 0->1 or 1->0 then follow this node with an RBE node.

You may also optionally specify a `msg.topic` if required.

**Note**: For a more complex version with more built-in options see Pete Scargill's
[node-red-contrib-bigtimer](http://flows.nodered.org/node/node-red-contrib-bigtimer) node.
