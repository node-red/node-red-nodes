node-red-node-sqlite
====================

A Node-Red node to read and write a local sqlite database.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-sqlite


Usage
-----

Allows basic access to a Sqlite database.

This node uses the <b>db.all</b> operation against the configured database. This does allow INSERTS, UPDATES and DELETES.

By it's very nature it is SQL injection... so *be careful* out there...

**msg.topic** must hold the <i>query</i> for the database, and the result is returned in **msg.payload**.

Typically the returned payload will be an array of the result rows, (or an error).

The reconnect timeout in milliseconds can be changed by adding a line to **settings.js**

    sqliteReconnectTime: 20000,
