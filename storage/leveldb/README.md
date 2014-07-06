node-red-node-leveldb
=====================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to read and write to a LevelDB database.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-leveldb


Usage
-----

Allows basic access to a LevelDB database.

Uses <a href="https://code.google.com/p/leveldb/" target="_new"><i>LevelDB</i></a> for a simple key value pair database.

There are two node to choose from...

Use one node to either <b>put</b> (store) the <b>msg.payload</b> to the named database file, using <b>msg.topic</b> as the key, or to <b>delete</b> information select delete in the properties dialogue and again use <b>msg.topic</b> as the key.</b>.

Use the other node to <b>get</b>, or retrieve the data already saved in the database.

Again use <b>msg.topic</b> to hold the <i>key</i> for the database, and the result is returned in <b>msg.payload</b>. If nothing is found for the key then <i>null</i> is returned.
