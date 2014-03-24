# Node-RED Nodes

A collection of nodes for [Node-RED](http://nodered.org). See below for a list.

## Installation

Eventually, the nodes will be npm-installable, but we're not there yet. Until then:

1. cd into the `nodes` directory of Node-RED
2. Either:
  - download the zip of the repository and extract it
  - run `git clone https://github.com/node-red/node-red-nodes.git`
3. npm install any of the individual node dependencies

This is all too manual, so the sooner we npm-enable this stuff the better

## Contributing

Please read the Contributing section of the main project [README](https://github.com/node-red/node-red/blob/master/README.md)

The key points are:
 - try to follow the conventions we use (all undocumented at the moment just to make it interesting)
 - focus on the UX of the node - make it simple to do simple things and simple to do advanced things. Don't
   force a user wanting to do simple things have to wade through the advanced things.
 - avoid duplication

### Contributor License Agreement

In order for us to accept pull-requests, the contributor must first complete
a Contributor License Agreement (CLA). This clarifies the intellectual
property license granted with any contribution. It is for your protection as a
Contributor as well as the protection of IBM and its customers; it does not
change your rights to use your own Contributions for any other purpose.

Once you have created a pull-request, we'll provide a link to the appropriate
CLA document.

If you are an IBMer, please contact us directly as the contribution process is
slightly different.


## Copyright and license

Copyright 2013 IBM Corp. under [the Apache 2.0 license](LICENSE).

# Extra Node Information

### Analysis

**72-wordpos** - Analyses the payload and classifies the part-of-speech of each word. The resulting message has msg.pos added with the results. A word may appear in multiple categories (eg, 'great' is both a noun and an adjective).

**74-swearfilter** - Analyses the payload and tries to filter out any messages containing bad swear words. This only operates on payloads of type string. Everything else is blocked.

### Hardware

**37-rpi-piface** - Adds support for the PiFace interface module for Raspberry Pi.

**78-ledborg** - A simple driver for the LEDborg plug on module for Raspberry Pi.

**60-wemo** - Basic node to drive a WeMo socket and switch. Does not use discovery.

**76-blinkstick** - Provides support for the BlinkStick USB LED device.

**77-blink1** - Provides support for the Blink1 USB LED from ThingM.

**78-digiRGB** - Provides support for the DigiSpark RGB USB LED.

**79-sensorTag** - Reads data from the Ti BLE SensorTag device.

**100-heatmiser-in** - Writes settings for temperature and frost protection to Heatmiser thermostats.

**101-heatmiser-out** - Reads settings from Heatmiser thermostats at a polling interval.

**101-scanBLE** - Scans for a particular Bluetooth Low Energy (BLE) device.

### IO

**26-rawserial** - Only really needed for Windows boxes without serialport npm module installed.
Uses a simple read of the serial port as a file to input data. You **must** set the baud rate etc externally *before* starting Node-RED. This node does not implement pooling of connections so only one instance of each port may be used - so in **or** out but **not** both.

**39-wol** - Sends a Wake-On-LAN magic packet to the mac address specified. You may instead set msg.mac to dynamically set the target device mac to wake up.

**88-ping** - Pings a machine and returns the trip time in mS. Returns false if no response received within 3 seconds, or if the host is unresolveable. Default ping is every 20 seconds but can be configured.

### Social

**69-mpd** - MPD music control nodes. Output node expects payload to be a valid mpc command. Currently only simple commands that expect no reply are supported. Input node creates a payload object with Artist, Album, Title, Genre and Date.

**57-notify** - Uses Growl to provide a desktop popup containing the payload. Only useful on the local machine.

**57-prowl** - Uses Prowl to push the payload to an Apple device that has the Prowl app installed.

**57-pushbullet** - Uses PushBullet to push the payload to an Android device that has the PushBullet app installed.

**92-xmpp** - Connects to an XMPP server to send and receive messages.

### Storage

**67-leveldb** - Uses LevelDB for a simple key value pair database.

**68-mysql** - Allows basic access to a MySQL database. This node uses the **query** operation against the configured database. This does allow both INSERTS and DELETES. By it's very nature it allows SQL injection... *so be careful out there...*

**69-ddbout** - Support output to Amazon DynamoDB.

### Time

**79-suncalc** - Uses the suncalc module to generate an output at sunrise and sunset based on a specified location. Several choices of definition of sunrise and sunset are available,

### Misc

**99-sample** - A sample node with more comments than most to try to help you get started without any other docs...
