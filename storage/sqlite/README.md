node-red-node-sqlite
====================

A Node-Red node to read and write a local sqlite database.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i --unsafe-perm node-red-node-sqlite

**Note**: the install process requires a compile of native code. This can take 15-20 minutes on
devices like a Raspberry Pi - please be prepared to wait a long time. Also if node.js is upgraded at any point you will need to rebuild the native part manually, for example.

    cd ~/.node-red
    npm rebuild


Usage
-----

Allows basic access to a Sqlite database.

This node uses the <b>db.all</b> operation against the configured database.
This does allow INSERTS, UPDATES and DELETES.

By it's very nature it is SQL injection... so *be careful* out there...

`msg.topic` must hold the <i>query</i> for the database, and the result is returned in `msg.payload`.

Typically the returned payload will be an array of the result rows, (or an error).

You can load sqlite extensions by inputting a <code>msg.extension</code> property containing the full path and filename.

The reconnect timeout in milliseconds can be changed by adding a line to **settings.js**

    sqliteReconnectTime: 20000,
