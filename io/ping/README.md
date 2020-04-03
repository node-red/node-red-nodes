node-red-node-ping
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to ping a
remote server, for use as a keep-alive check.

Install
-------

Either use the Editor - Menu - Manage Palette - Import option or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-ping


**Gotchas**

 1 Ubuntu Snap containers are strict and do not like giving external commands (like ping) external access. To allow ping to work you must manually add the network-observe interface

     sudo snap connect node-red:network-observe

 2 On some versions on Raspbian (Raspberry Pi) `ping` seems to be a root only command.
The fix is to allow it as follows

    sudo setcap cap_net_raw=ep /bin/ping
    sudo setcap cap_net_raw=ep /bin/ping6

Usage
-----

Pings 1 or more devices and returns the trip time in mS as `msg.payload`.

Returns boolean `false` if no response received, or if the host is unresolveable.

`msg.error` will contain any error message if necessary.

`msg.topic` contains the ip address of the target host.

There are 2 modes - `Timed` and `Triggered`.

* Timed mode - this is the default mode that pings your devices on a timed basis. Default ping is every 20 seconds but can be configured.
* Triggered mode - this mode permits you to trigger the ping by an input message. If the `Target` is left blank and `msg.payload` is a string or array, you can ping 1 or more devices on demand.

Refer to the built in help on the side-bar info panel for more details.
