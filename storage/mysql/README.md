node-red-node-mysql
========================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to read and write to a MySQL database.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-mysql


Usage
-----

Allows basic access to a MySQL database.

This node uses the <b>query</b> operation against the configured database. This does allow both INSERTS and DELETES.

By it's very nature it allows SQL injection... so <i>be careful out there...</i>

The `msg.topic` must hold the <i>query</i> for the database, and the result is returned in `msg.payload`.

Typically the returned payload will be an array of the result rows.

If nothing is found for the key then <i>null</i> is returned.

The reconnect retry timeout in milliseconds can be changed by adding a line to <b>settings.js</b>
    <pre>mysqlReconnectTime: 30000,</pre></p>
