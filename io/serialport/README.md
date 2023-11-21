node-red-node-serialport
========================

<a href="http://nodered.org" target="noderedinfo">Node-RED</a> nodes to talk to
hardware serial ports.

## Install

To install the stable version use the `Menu - Manage palette - Install` option and search for node-red-node-serialport, or run the following command in your Node-RED user directory, typically `~/.node-red`

        npm i node-red-node-serialport

During install there may be multiple messages about optional compilation.
These may look like failures... as they report as failure to compile errors -
but often are warnings and the node will continue to install and, assuming nothing else
failed, you should be able to use it. Occasionally some platforms *will* require
you to install the full set of tools in order to compile the underlying package.

## Usage

Provides three nodes - one to receive messages, and one to send, and a request node which can send then wait for a response.

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

### Request

Provides a connection to a request/response serial port.

This node behaves as a tightly coupled combination of serial in and serial out nodes, with which it shares the configuration.

Send the request message in `msg.payload` as you would do with a serial out node. The message will be forwarded to the serial port following a strict FIFO (First In, First Out) queue, waiting for a single response before transmitting the next request. Once a response is received (with the same logic of a serial in node), or after a timeout occurs, a message is produced on the output, with msg.payload containing the received response (or missing in case if timeout), msg.status containing relevant info, and all other fields preserved.

For consistency with the serial in node, msg.port is also set to the name of the port selected.

### Serial Control
When the node-red starts, the flow(program) picks up the pre-programmed serial port, open it, and start the communication. But there are some cases the port needs to switch to a different port, stop, and start again. For example, in order to upload a new binary for Arduino, the serial port needs to be stopped relased from the nodered, and start it again after uploading. Or when the FTDI device re-connects after disconnected for any reason, it may be possible the port number change, and the end user of the flow can't change the port.


This `Serial Control` node provides the serial port control capability to 
1. change the serial port and its configuration on the run time programatically.
2. stop the communication and releasing the serial port so, for example the Arduino can upload the new binary without shutting down the nodered.
3. start the communication after stopped with this `Serial Control` node for above reason or the like.

<p>In order to control the communication, just send these JSON messages to the control node.</p>
```json
    {
        "serialport": "/dev/tty.usbmodem1234561",
        "serialbaud": 115200,
        "databits": 8,
        "parity": "none",
        "stopbits": 1
        "enable": true
    } 
```
changes the serial port and the configuration on the fly.  
<p>The following optional parameters will change the configuration only if they are present.</p>
<p>Any combination of them can be passed to change/control the serial communication</p> 
<ul>
    <li> serialport </li>
    <li> serialbaud </li>
    <li> databits </li>
    <li> parity </li>
    <li> stopbits </li>
    <li> dtr </li>
    <li> rts </li>
    <li> cts </li>
    <li> dsr </li>
    <li> bin </li>
    <li> out </li>
    <li> enable </li>
</ul>
<p>When the `enable` property is not present, it will default to `true`</p>
<p>
`{"enable":true}` or `{"enable":false}` will start or stop the communication.</p>
<p> If `enable` is passed along wiht other parameters, the configuration will be changed and either be started or just be ready to be started(ie. stopped ) depending on its value.  </p>

**Here is the serial control node usage example flow**

[
    {
        "id": "15bb070145462321",
        "type": "inject",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "AC026GAO,57600",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "{\"config\":{\"newport\":\"/dev/tty.usbserial-AC026GAO\",\"serialbaud\":57600,\"databits\":8,\"parity\":\"none\",\"stopbits\":1}}",
        "payloadType": "json",
        "x": 250,
        "y": 600,
        "wires": [
            [
                "cf47565c5a2fea27"
            ]
        ]
    },
    {
        "id": "1efa4bdcfff37d75",
        "type": "debug",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "debug 20",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 780,
        "y": 680,
        "wires": []
    },
    {
        "id": "f173dab817b51d1c",
        "type": "inject",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "usbmodem1234561",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "{\"config\":{\"newport\":\"/dev/tty.usbmodem1234561\"}}",
        "payloadType": "json",
        "x": 250,
        "y": 640,
        "wires": [
            [
                "cf47565c5a2fea27"
            ]
        ]
    },
    {
        "id": "cf47565c5a2fea27",
        "type": "serial control",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "",
        "serial": "b720bb12479b6ef1",
        "x": 570,
        "y": 680,
        "wires": [
            [
                "1efa4bdcfff37d75"
            ]
        ]
    },
    {
        "id": "e0aeaaebcd81fd25",
        "type": "inject",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "{\"stop\":\"\"}",
        "payloadType": "json",
        "x": 220,
        "y": 680,
        "wires": [
            [
                "cf47565c5a2fea27"
            ]
        ]
    },
    {
        "id": "2118ff6fce99b134",
        "type": "inject",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "{\"start\":\"\"}",
        "payloadType": "json",
        "x": 220,
        "y": 720,
        "wires": [
            [
                "cf47565c5a2fea27"
            ]
        ]
    },
    {
        "id": "fbea9cf5dbac9f0b",
        "type": "inject",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "{\"config\":\"query\"}",
        "payloadType": "json",
        "x": 250,
        "y": 760,
        "wires": [
            [
                "cf47565c5a2fea27"
            ]
        ]
    },
    {
        "id": "673064b652dde3d2",
        "type": "serial in",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "",
        "serial": "b720bb12479b6ef1",
        "x": 190,
        "y": 540,
        "wires": [
            [
                "13f27a28eda0df50"
            ]
        ]
    },
    {
        "id": "13f27a28eda0df50",
        "type": "debug",
        "z": "53ca91fecd4b75bb",
        "g": "c67578985101f329",
        "name": "debug 21",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 780,
        "y": 540,
        "wires": []
    },
    {
        "id": "b720bb12479b6ef1",
        "type": "serial-port",
        "name": "s1",
        "serialport": "/dev/tty.usbmodem1234561",
        "serialbaud": "115200",
        "databits": "8",
        "parity": "none",
        "stopbits": "1",
        "waitfor": "",
        "dtr": "none",
        "rts": "none",
        "cts": "none",
        "dsr": "none",
        "newline": "\\n",
        "bin": "false",
        "out": "char",
        "addchar": "",
        "responsetimeout": "10000"
    }
]

