node-red-node-makeymakey
========================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to read from a MakeyMakey input device.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-makeymakey


Pre-reqs
--------

As this requires an underlying npm this also requires it's pre-reqs, see <a href="https://www.npmjs.org/package/node-hid" target="_new">Node-hid npm</a> for more details.

 - libudev-dev (Linux only)
 - libusb-1.0-0-dev (Ubuntu versions missing libusb.h only)

As this uses the raw HID strea mit often requires you to run Node-RED as root, unless you have correct priviliges.

Usage
-----

Provides "keyboard" like input from a MakeyMakey device.

This uses the hidstream npm module that by default only supports the basic keyboard keys and **NOT** the mouse inputs, fn keys, keypad keys, cursor keys etc. This means that the extra mouse emulation jumpers won't work.

The MakeyMakey can of course be re-programmed to re-assign the keys - but this node doesn't know about that...

Known Issues
------------

1) Every now and then something causes the MakeyMakey HID to become detached (lose focus) from this app and re-attach to another (the in focus) app... whereupon the emulated keys will end up in the wrong window... - Any ideas on how to stop this would be greatly appreciated - but I suspect it's a fundamental issue with the MakeyMakey pretending to be a HID.

2) Default usage is such that you have to run as root. On Debian based systems you can copy the file <i>42-makey.rules</i> to the <code>/etc/udev/rules.d/</code> folder - this should let anyone then access the MakeyMakey. To restart udev use <pre>sudo udevadm control --reload-rules</pre>
