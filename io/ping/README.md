node-red-node-ping
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to ping a
remote server, for use as a keep-alive check.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-ping

**Gotcha**

On some versions on Raspbian (Raspberry Pi) `ping` seems to be a root only command.
The fix is to allow it as follows

    sudo setcap cap_net_raw=ep /bin/ping
    sudo setcap cap_net_raw=ep /bin/ping6

Usage
-----

Pings a machine and returns the trip time in mS as `msg.payload`.

Returns boolean `false` if no response received, or if the host is unresolveable.
`msg.error` will contain any error message if necessary.

`msg.topic` contains the ip address of the target host.

Default ping is every 20 seconds but can be configured.
