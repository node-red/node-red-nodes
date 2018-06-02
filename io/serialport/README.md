node-red-node-serialport
========================

<a href="http://nodered.org" target="noderedinfo">Node-RED</a> nodes to talk to
hardware Serial ports.

## Install

This node is sometimes installed by default in Node-RED so may not need to be installed manually.

Run the following command in your Node-RED user directory (typically `~/.node-red`):

        npm i node-red-node-serialport

During install there may be multiple messages about optional compilation.
These may look like failures... as they report as failure to compile errors -
but often are warnings and the node will continue to install and, assuming nothing else
failed, you should be able to use it. Occasionally some platforms *will* require
you to install the full set of tools in order to compile the underlying package.

## Usage

Provides two nodes - one to receive messages, and one to send.

### Input

Reads data from a local serial port.

Clicking on the search icon will attempt to autodetect serial ports attached to
the device, however you many need to manually specify it. COM1, /dev/ttyUSB0, etc

It can either

 - wait for a "split" character (default \n). Also accepts hex notation (0x0a).
 - wait for a timeout in milliseconds from the first character received
 - wait to fill a fixed sized buffer

It then outputs `msg.payload` as either a UTF8 ascii string or a binary Buffer object.

If no split character is specified, or a timeout or buffer size of 0, then a stream
of single characters is sent - again either as ascii chars or size 1 binary buffers.

### Output

Provides a connection to an outbound serial port.

Only the `msg.payload` is sent.

Optionally the character used to split the input can be appended to every message sent out to the serial port.
