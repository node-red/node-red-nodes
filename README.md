# Node-RED Nodes

A collection of nodes for [Node-RED](http://nodered.org). See below for a list.

## Installation

Many of these nodes are available as an npm package. See the respective README.md for the npm package name. 

To manually install using this repo: 

1. cd into the `nodes` directory of Node-RED
2. Either:
  - download the zip of the repository and extract it
  - run `git clone https://github.com/node-red/node-red-nodes.git`
3. npm install in any of the node subfolders to install individual node's dependencies

This is all too manual, so the sooner we npm-enable this stuff the better

## Contributing

See the [Contributing Guide](https://github.com/node-red/node-red/blob/master/CONTRIBUTING.md) of the node-red project.

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

**[72-wordpos](analysis/wordpos)** - Analyses the payload and classifies the part-of-speech of each word. The resulting message has msg.pos added with the results. A word may appear in multiple categories (eg, 'great' is both a noun and an adjective).

**[74-swearfilter](analysis/swearfilter)** - Analyses the payload and tries to filter out any messages containing bad swear words. This only operates on payloads of type string. Everything else is blocked.

### Hardware

**[37-rpi-piface](hardware/PiFace)** - Adds support for the [PiFace](http://www.piface.org.uk/) interface module for Raspberry Pi.

**[38-rpi-pibrella](hardware/Pibrella)** - Controls a [Pibrella](http://pibrella.com/) add-on board for a Raspberry-Pi.

**[39-rpi-piliter](hardware/PiLiter)** - Controls a Pimorini Pi-LITEr 8 LED add-on board for a Raspberry-Pi.

**[42-makey](hardware/makey)** - A Node-RED node to read from a [MakeyMakey](http://www.makeymakey.com/) input device.

**[60-wemo](hardware/wemo)** - Basic node to drive a [WeMo](http://www.belkin.com/us/Products/home-automation/c/wemo-home-automation/) socket and switch. Does not use discovery.

**[76-blinkstick](hardware/blinkstick)** - Provides support for the [BlinkStick](http://www.blinkstick.com/) USB LED device.

**[77-blink1](hardware/blink1)** - Provides support for the [Blink1](http://blink1.thingm.com/) USB LED from ThingM.

**[78-ledborg](hardware/LEDborg)** - A simple driver for the [LEDborg](https://www.piborg.org/ledborg) plug on module for Raspberry Pi.

**[78-digiRGB](hardware/digiRGB)** - Provides support for the DigiSpark RGB USB LED.

**[79-sensorTag](hardware/sensorTag)** - Reads data from the Ti Bluetooh Low Energy (BLE) SensorTag device.

**100-heatmiser-in** - Writes settings for temperature and frost protection to Heatmiser thermostats.

**101-heatmiser-out** - Reads settings from Heatmiser thermostats at a polling interval.

**101-scanBLE** - Scans for a particular Bluetooth Low Energy (BLE) device.

**103-hue_discover** - Looks for a Philips Hue Bridge in the local network.

**104-hue_manag** - Implements some basic functionality for managing a Philips Hue wireless Lamp system.

**[145-BBB-hardware](hardware/BBB)** - A collection of analogue & digital input & output nodes for the [Beaglebone Black](http://beagleboard.org/black).

### IO

**[18-stomp](io/stomp)** - A Node-RED node to publish and subscribe to and from a [STOMP server](https://stomp.github.io/implementations.html#STOMP_Servers).

**26-rawserial** - Only really needed for Windows boxes without serialport npm module installed.
Uses a simple read of the serial port as a file to input data. You **must** set the baud rate etc externally *before* starting Node-RED. This node does not implement pooling of connections so only one instance of each port may be used - so in **or** out but **not** both.

**[39-wol](io/wol)** - Sends a Wake-On-LAN magic packet to the mac address specified. You may instead set msg.mac to dynamically set the target device mac to wake up.

**[88-ping](io/ping)** - Pings a machine and returns the trip time in mS. Returns false if no response received within 3 seconds, or if the host is unresolveable. Default ping is every 20 seconds but can be configured.

**88-emoncms** - Adds node to post to an [Emoncms](http://emoncms.org/) server.

### Social

**55-dweetio** - Uses [dweetio](https://dweet.io/) to send/receive messages.

**[56-twilio](social/twilio)** - Uses [Twilio](https://www.twilio.com/) service to send/receive text messages.

**[57-nma](social/nma)** - Sends alerts to Android devices via the [Notify-My-Android](http://www.notifymyandroid.com/) app.

**57-notify** - Uses [Growl](http://growl.info/) to provide a desktop popup containing the payload. Only useful on the local Apple machine.

**[57-prowl](social/prowl)** - Uses [Prowl](http://www.prowlapp.com/) to push the payload to an Apple device that has the Prowl app installed.

**[57-pushbullet](social/pushbullet)** - Uses [PushBullet](https://www.pushbullet.com/) to push the payload to an Android device that has the [PushBullet](https://www.pushbullet.com/) app installed.

**[57-pushover](social/pushover)** - Sends alerts via [Pushover](https://pushover.net/).

**69-mpd** - MPD music control nodes. Output node expects payload to be a valid mpc command. Currently only simple commands that expect no reply are supported. Input node creates a payload object with Artist, Album, Title, Genre and Date.

**79-snapchat** - Downloads [SnapChat](https://www.snapchat.com/) images from the account specified.

**[92-xmpp](social/xmpp)** - Connects to an XMPP server to send and receive messages.

**114-pusher** - Publish-Subscribe to a [Pusher](http://pusher.com/) channel/event.

### Storage

**[67-leveldb](storage/leveldb)** - Uses LevelDB for a simple key value pair database.

**[68-mysql](storage/mysql)** - Allows basic access to a MySQL database. This node uses the **query** operation against the configured database. This does allow both INSERTS and DELETES. By it's very nature it allows SQL injection... *so be careful out there...*

**69-ddbout** - Support output to Amazon DynamoDB.

**110-postgres** - PostgreSql I/O node.

**[sqlite](storage/sqlite)** - Supports read and write to a local sqlite database.

### Time

**[79-suncalc](time)** - Uses the suncalc module to generate an output at sunrise and sunset based on a specified location. Several choices of definition of sunrise and sunset are available,

### Misc

**99-sample** - A sample node with more comments than most to try to help you get started without any other docs...
