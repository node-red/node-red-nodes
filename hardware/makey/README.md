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

Usage
-----

Provides "keyboard" like input from a MakeyMakey device.

This uses the hidstream npm module that by default only supports the basic keyboard keys and **NOT** the mouse inputs, fn keys, keypad keys, cursor keys etc. This means that the extra mouse emulation jumpers won't work.

The MakeyMakey can of course be re-programmed to re-assign the keys - but this node doesn't know about that...

Known Issues
------------

Every now and then something causes the MakeyMakey HID to become detached (lose focus) from this app and re-attach to another (the in focus) app... whereupon the emulated keys will end up in the wrong window... - Any ideas on how to stop this would be greatly appreciated - but I suspect it's a fundamental issue with the MakeyMakey pretending to be a HID.
