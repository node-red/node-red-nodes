node-red-node-mongodb
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to save data in a MongoDB database.

**Note** : This is the same node as was in the core of Node-RED.
As of v0.10.8 you will need to install it from here if still required.

Pre-requisite
-------------

To run this you need a local MongoDB server running. For details see
<a href="https://www.mongodb.org/" target="_new">the MongoDB site</a>.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`
```
        npm install node-red-node-mongodb
```
Note that this package requires a MongoDB client package at least version 3.6.3 - if you have an older (version 2) client,
you may need to remove that before installing this
```
        npm remove mongodb
        npm install node-red-node-mongodb
```

Usage
-----

Nodes to save and retrieve data in a MongoDB instance - the database server can be local (mongodb//:localhost:27017), remote (mongodb://hostname.network:27017),
replica-set or cluster (mongodb://hostnameA.network:27017,hostnameB.network:27017), and DNS seedlist cluster (mongodb+srv://clustername.network).

Reference [MongoDB docs](https://docs.mongodb.com/manual/reference/connection-string/) to see which connection method (host or clustered) to use for your MongoDB instance.

### Input

Calls a MongoDB collection method based on the selected operator.

*Find* queries a collection using the `msg.payload` as the query statement as
per the *.find()* function.

Optionally, you may also (via a function) set

- a `msg.projection` object to constrain the returned fields,
- a `msg.sort` object,
- a `msg.limit` number,
- a `msg.skip` number.

*Count* returns a count of the number of documents in a collection or matching a
query using the `msg.payload` as the query statement.

*Aggregate* provides access to the aggregation pipeline using the `msg.payload` as the pipeline array.

You can either set the collection method in the node config or on `msg.collection`.
Setting it in the node will override `msg.collection`.

See the <a href="http://docs.mongodb.org/manual/reference/method/db.collection.find/" target="new">*MongoDB collection methods docs*</a> for examples.

The result is returned in `msg.payload`.

### Output

A simple MongoDB output node. Can save, insert, update and remove objects from a chosen collection.

MongoDB only accepts objects.

Save and insert can either store `msg` or `msg.payload`. If msg.payload is
selected it should contain an object. If not it will be wrapped in an object with a name of payload.

*Save* will update an existing object or insert a new object if one does not already exist.

*Insert* will insert a new object.

*Update* will modify an existing object or objects. The query to select objects
to update uses `msg.query` and the update to the element uses `msg.payload`.
Update can add an object if it does not exist or update multiple objects.

*Remove* will remove objects that match the query passed in on `msg.payload`.
A blank query will delete *all of the objects* in the collection.

You can either set the collection method in the node config or on `msg.collection`.
Setting it in the node will override `msg.collection`.

By default MongoDB creates an `msg._id` property as the primary key - so
repeated injections of the same `msg` will result in many database entries.
If this is NOT the desired behaviour - ie. you want repeated entries to overwrite,
then you must set the `msg._id` property to be a constant by the use of a previous function node.
This must be done at the correct level. If only writing msg.payload then payload must contain the \_id property.
If writing the whole msg object then it must contain an \_id property.

This could be a unique constant or you could create one based on some other msg property.

Currently we do not limit or cap the collection size at all...
