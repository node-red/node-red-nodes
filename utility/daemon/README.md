node-red-node-daemon
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that runs and monitors a long running system command.

Similar to the **exec** node  - but this calls the command at start time and then pipes any input to the node to the STDIN of the running command, and feeds any STDOUT to the first output.

Useful for monitoring command line based processes.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-daemon


Usage
-----

Calls out to a long running system command. Sends <b>msg.payload</b> to stdin of the process.

Provides 3 outputs... stdout, stderr, and return code, from the running command.

If the called program stops (i.e. a return code is produced), this node can attempt to restart the command.

**Note :** when you stop Node-RED running we may not get a chance to kill the called program so it may remain running. You <i>may</i> have to kill it manually.

For example I have used it to run and then monitor the <a href="https://github.com/antirez/dump1090" target ="_new">dump1090</a> plane spotter, and also to interact with various python apps that everyone seem to write these days :-)
