node-red-node-mysql
========================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to read and write to a MySQL database.

Install
-------

Either use the `Node-RED Menu - Manage Palette - Install`, or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-mysql


Usage
-----

Allows basic access to a MySQL database.

This node uses the **query** operation against the configured database. This does allow both INSERTS and DELETES.

By its very nature it allows SQL injection... so *be careful out there...*

The `msg.topic` must hold the *query* for the database, and the result is returned in `msg.payload`.

Typically the returned payload will be an array of the result rows.

If nothing is found for the key then *null* is returned.

The reconnect retry timeout in milliseconds can be changed by adding a line to **settings.js**
```javascript
mysqlReconnectTime: 30000,
```

The timezone can be set like GMT, EST5EDT, UTC, etc.

The charset defaults to the "old" Mysql 3 byte UTF. If you need support for emojis etc then use UTF8MB4.


Preparing Queries
-----
```javascript
msg.payload=[24, 'example-user'];
msg.topic="INSERT INTO users (`userid`, `username`) VALUES (?, ?);"
return msg;
```

with named parameters:

```javascript
msg.payload={}
msg.payload.userToChange=42;
msg.payload.newUsername="example-user";
msg.topic="INSERT INTO users (`userid`, `username`) VALUES (:userToChange, :newUsername) ON DUPLICATE KEY UPDATE `username`=:newUsername;"
return msg;
```

Documentation
-----
 
<a href="https://www.npmjs.com/package/mysql" target="_new">Documentation</a> of the used Node.js package    
