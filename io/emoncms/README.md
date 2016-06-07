node-red-node-emoncms
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send fetch/post data to/from <a href="http://emoncms.org" target="_new">emoncms.org</a> or any other emoncms server.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-node-emoncms


Usage
-----

### Emoncms post.

The `msg.payload` can contain either a comma separated list of name
value pairs, e.g.

        name:value,...

or a comma separated list of values, e.g.

        1,2,..

or a simple javascript object e.g.

        msg.payload = {temp:12, humidity:56};

If *Nodegroup* is left blank `msg.nodegroup` will used (if set).
This should be a numeric value.

Insertion time can be manipulated by setting `msg.time`. This **must** be in
epoch format - i.e. seconds since 1970.

### Emoncms In:

Fetches last emoncms feed value, returns a numerical value.
