node-red-node-leveldb
=====================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to read and write to a LevelDB database.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-leveldb


Usage
-----

Allows basic access to a LevelDB database.

Uses <a href="https://code.google.com/p/leveldb/" target="_new"><i>LevelDB</i></a> for a simple key value pair database.

There are two node to choose from...

Use one node to either <b>put</b> (store) the `msg.payload` to the named database file, using `msg.topic`
as the key, or to <b>delete</b> information select delete in the properties dialogue and again use `msg.topic` as the key.

Use the other node to <b>get</b>, or retrieve the data already saved in the database.

Again use `msg.topic` to hold the <i>key</i> for the database, and the result is returned in `msg.payload`.
If nothing is found for the key then <i>null</i> is returned.
