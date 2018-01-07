node-red-node-emoncms
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send fetch/post data to/from <a href="http://emoncms.org" target="_new">emoncms.org</a>, local emoncms server or any other emoncms server.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-node-emoncms

Usage
-----

### Emoncms post:
#### Preferred Data Type

The API now accepts  a validated JSON object for the name value pairs.  This is the preferred data type.

#### Legacy Data Type Support

The original input API for emoncms used a URI in the format `post.json?`.  If the data type of legacy is selected, the `msg.payload` can contain:

A comma separated list of name value pairs, e.g.

    name:value,...

A comma separated list of values (CSV), e.g.

    1,2,..

A simple javascript object (note no quotes) e.g.

    {temp:12, humidity:56};

#### Node
If *Node* is left blank `msg.nodegroup` will be used (if set).  A *Node* must be set or the flow will fail.

#### msg.time
Insertion time can be manipulated by setting `msg.time`. This can be an ISO format date/time or a number of seconds in epoch format - i.e. seconds since 1970.  If no time is set time now is set by emoncms.

#### Status
The flow will indicate if the node has successfully called the API.  This is not a guarantee the data has been inserted to emoncms.

### Emoncms In:

Fetches last emoncms feed value, returns a numerical value.
