node-red-node-discover
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that uses Bonjour
 / Avahi to discover local network services such as iTunes libraries, printers, etc.

Prerequisites
-------------

please read the [install instructions](https://www.npmjs.com/package/mdns) for the underlying npm.

For Debian / Ubuntu this requires installing

    sudo apt-get install libavahi-compat-libdnssd-dev

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-discover

Usage
-----

Uses a javascript implenetation of mdns ( mdns-js ) to provide a Bonjour / Avahi
service discovery capability.

**msg.payload** contains the service object on both arrival and leaving.

**msg.state** contains boolean true or false depending if the service has arrived (true) or gone away (false)..

Within the msg.payload object the most interesting things are:

 * msg.payload.name
 * msg.payload.interface
 * msg.payload.port
 * msg.payload.addresses
 * msg.payload.txtRecord

For a full list of official service types see [this list](http://www.dns-sd.org/ServiceTypes.html" target="_new).

**Note**: When Node-RED starts you will get a big WARNING message about the Bonjour compatability layer... this is just a warning so don't worry.
