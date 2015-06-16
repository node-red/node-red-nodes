node-red-node-redis
===================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to save data in a Redis database.

**Note** : This is the same node as was in the core of Node-RED.
As of v0.10.8 you will need to install it from here if still required.

Pre-requisite
-------------

To run this you need a local Redis server running. For details see <a href="http://redis.io/" target="_new">the Redis site</a>.


Install
-------

Run the following command in the root directory of your Node-RED install.
Usually this is `~/.node-red` .

        npm install node-red-node-redis

Usage
-----

Simple node to save data in a local Redis instance

###Output

A Redis output node. Options include **Hash**, **Set**, **List** and **String**.

If **key** is blank, the **msg.topic** will be used as the key.

If **type** is *hash*, **msg.payload** should be an *object* or *field=value* string.
