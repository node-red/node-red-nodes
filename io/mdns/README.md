node-red-node-discovery
=======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that uses Bonjour
 / Avahi to discover local network services such as iTunes libraries, printers, etc.

It also supports announcing new services.

Prerequisites
-------------

please read the [install instructions](https://www.npmjs.com/package/mdns) for the underlying npm.

For Debian / Ubuntu this requires installing

        sudo apt-get install libavahi-compat-libdnssd-dev libudev-dev
        
> For DietPi installations, if you encounter this error when executing the node
>
>        Error: getaddrinfo -3008
>        
> You may need to install `libnss-mdns` as well
>
>        sudo apt-get install libnss-mdns


Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm i node-red-node-discovery

Usage
-----

### Discovery

Uses an implementation of mdns to provide a Bonjour / Avahi
service discovery capability.

`msg.payload` contains the service object on both arrival and leaving.

`msg.payload.state` contains boolean true or false depending if the service has arrived (true) or gone away (false)..

Within the `msg.payload` object the most interesting things are:

 * msg.payload.name
 * msg.payload.interface
 * msg.payload.port
 * msg.payload.addresses
 * msg.payload.txtRecord

For a full list of official service types see [this list](http://www.dns-sd.org/ServiceTypes.html" target="_new).

### Announce

Provides a Bonjour / Avahi / Zeroconf announcement node.

If `msg.payload` is `false` - the announcement is stopped. Any other value starts the announcement process.

The announcement can be customised by the msg if not configured in the edit panel.

 - `msg.service` - For a full list of official service types see <a href="http://www.dns-sd.org/ServiceTypes.html" target="_new">this list</a>.
 - `msg.port` - the tcp or udp port to use.
 - `msg.name` - the short description name of the service. If you use %h in the name, it will be replaced by the machine hostname.
 - `msg.txtRecord` - a set of comma separated name:value pairs

### Note:

When Node-RED starts you will get a big WARNING message about the Bonjour Compatibility layer... this is just a warning so don't worry.
