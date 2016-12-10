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

This node uses the query operation against the configured database. This does allow both INSERTS and DELETES.

Using legacy method of queries set in `msg.topic` allows SQL injection... so be careful out there...

###Query

Enter SQL queries and escapes input values that are located at a set path in the msg object.

SQL queries can use template literal style variable insertion. If our msg.payload has a property key, we would write a query as following:

```
    SELECT *
    FROM table
    WHERE column = ${key};
```

For escaped input clarification, you can refer to the documentation for mysqljs/mysql.

###Results

Typically the returned payload will be an array of the result rows.

If nothing is found for the key then null is returned,

###Misc.

The reconnect timeout in milliseconds can be changed by adding a line to settings.js

`mysqlReconnectTime: 30000,`

###Legacy

`msg.topic` must hold the query for the database, and the result is returned in `msg.payload`.

`msg.payload` can contain an array of values to bind to the topic.
