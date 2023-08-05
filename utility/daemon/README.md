node-red-node-daemon
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that runs and
monitors a long running system command.

Similar to the **exec** node  - but this calls the command at start time and
then pipes any input to the node to the STDIN of the running command, and feeds
any STDOUT to the first output.

Useful for monitoring command line based processes.

Install
-------

Either use the Editor - Menu - Manage Palette - Install option or
run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-daemon


Usage
-----

Calls out to a long running system command. Sends `msg.payload` to stdin of the process.

**Note** Only the command itself should be placed in the command field.
All parameters **must** be placed in the arguments field.

The command provides 3 outputs... stdout, stderr, and return code, from the running command.

If the called program stops (i.e. a return code is produced), this node can attempt
to restart the command automatically.

Setting `msg.kill` to a signal name (e.g. SIGINT, SIGHUP) will stop the process - but if the restart flag is set it will then auto restart.

Sending `msg.start` will start the process, if not already running. Additional arguments can be specified in `msg.args`.

Sending `msg.stop` will stop the process and prevent automatic re-start until reset with `msg.start`.

**Note:** Some applications will automatically buffer lines of output. It is advisable to turn off this behaviour.
For example, if running a Python app, the `-u` parameter will stop the output being buffered.


For example it can be used to run and then monitor the
<a href="https://github.com/antirez/dump1090" target="_new">dump1090</a> plane
spotter, and also to interact with various python apps that everyone seem to write
these days :-)
