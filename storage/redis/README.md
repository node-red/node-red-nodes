node-red-node-redis
===================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to save data in a Redis database.

Pre-requisite
-------------

To run this you need a local Redis server running. For details see <a href="http://redis.io/" target="_new">the Redis site</a>.


Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-node-redis

Usage
-----

Simple node to save data in a local Redis instance

### Output

A Redis output node. Options include **Hash**, **Set**, **List** and **String**.

If **key** is blank, the `msg.topic` will be used as the key.

If **type** is *hash*, `msg.payload` should be an *object* or *field=value* string.
