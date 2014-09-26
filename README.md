# Node-RED Nodes

A collection of nodes for [Node-RED](http://nodered.org). See below for a list.

## Installation

Most of these nodes are available as npm packages. See the list below for the npm package names, or [search npm](https://www.npmjs.org/search?q=node-red-node).

To install

    cd node-red
    npm install node-red-node-{*filename*}

This repository acts as an overall store for these nodes - and is no longer intended as a way to install them - unless you really do want some bloat.

To manually install using this repo:

1. cd into the `nodes` directory of Node-RED
2. Either:
  - download the zip of the repository and extract it
  - run `git clone https://github.com/node-red/node-red-nodes.git`
3. npm install in any of the node subfolders to install individual node's dependencies

## Contributing

Now that we support npm installaton of nodes we recommend people post their own via [npm](https://www.npmjs.org/). Please read the [packaging guide notes](http://nodered.org/docs/creating-nodes/packaging.html).

If you are an IBMer, please contact us directly as the contribution process is slightly different.


## Copyright and license

Copyright 2013,2014 IBM Corp. under [the Apache 2.0 license](LICENSE).

# Extra Node Information

NPM name - File-link - Description

### Analysis

**node-red-node-wordpos** - *[72-wordpos](analysis/wordpos)* - Analyses the payload and classifies the part-of-speech of each word. The resulting message has msg.pos added with the results. A word may appear in multiple categories (eg, 'great' is both a noun and an adjective).

**node-red-node-wordpos** - *[74-swearfilter](analysis/swearfilter)* - Analyses the payload and tries to filter out any messages containing bad swear words. This only operates on payloads of type string. Everything else is blocked.

### Function

**node-red-node-smooth** - *[17-smooth](analysis/smooth)*  - A simple node to provide various functions across several previous values, including max, min, mean, high and low pass filters.

### Hardware

**node-red-node-beaglebone** - *[145-BBB-hardware](hardware/BBB)* - A collection of analogue & digital input & output nodes for the [Beaglebone Black](http://beagleboard.org/black).

**node-red-node-piface** - *[37-rpi-piface](hardware/PiFace)* - Adds support for the [PiFace](http://www.piface.org.uk/) interface module for Raspberry Pi.

**node-red-node-pibrella** - *[38-rpi-pibrella](hardware/Pibrella)* - Controls a [Pibrella](http://pibrella.com/) add-on board for a Raspberry-Pi.

**node-red-node-piliter** - *[39-rpi-piliter](hardware/PiLiter)* - Controls a Pimorini Pi-LITEr 8 LED add-on board for a Raspberry-Pi.

**node-red-node-blinkstick** - *[76-blinkstick](hardware/blinkstick)* - Provides support for the [BlinkStick](http://www.blinkstick.com/) USB LED device.

**node-red-node-blink1** - *[77-blink1](hardware/blink1)* - Provides support for the [Blink1](http://blink1.thingm.com/) USB LED from ThingM.

**node-red-node-ledborg** - *[78-ledborg](hardware/LEDborg)* - A simple driver for the [LEDborg](https://www.piborg.org/ledborg) plug on module for Raspberry Pi.

**node-red-node-digirgb** - *[78-digiRGB](hardware/digiRGB)* - Provides support for the DigiSpark RGB USB LED.

**node-red-node-wemo** - *[60-wemo](hardware/wemo)* - Basic node to drive a [WeMo](http://www.belkin.com/us/Products/home-automation/c/wemo-home-automation/) socket and switch. Does not use discovery.

**N/A** - *[42-makey](hardware/makey)* - A Node-RED node to read from a [MakeyMakey](http://www.makeymakey.com/) input device.

**N/A** - *[79-sensorTag](hardware/sensorTag)* - Reads data from the Ti Bluetooh Low Energy (BLE) SensorTag device.

**N/A** - *[100-heatmiser-in](hardware/heatmiser)* - Writes settings for temperature and frost protection to Heatmiser thermostats.

**N/A** - *[101-heatmiser-out](hardware/heatmiser)* - Reads settings from Heatmiser thermostats at a polling interval.

**N/A** - *[101-scanBLE](hardware/scanBLE)* - Scans for a particular Bluetooth Low Energy (BLE) device.

**N/A** - *[103-hue_discover](hardware/hue)* - Looks for a Philips Hue Bridge in the local network.

**N/A** - *[104-hue_manage](hardware/hue)* - Implements some basic functionality for managing a Philips Hue wireless Lamp system.

### IO

**node-red-node-stomp** - *[18-stomp](io/stomp)* - A Node-RED node to publish and subscribe to and from a [STOMP server](https://stomp.github.io/implementations.html#STOMP_Servers).

**node-red-node-wol** - *[39-wol](io/wol)* - Sends a Wake-On-LAN magic packet to the mac address specified. You may instead set msg.mac to dynamically set the target device mac to wake up.

**node-red-node-ping** - *[88-ping](io/ping)* - Pings a machine and returns the trip time in mS. Returns false if no response received within 3 seconds, or if the host is unresolveable. Default ping is every 20 seconds but can be configured.

**N/A** - *[88-emoncms](io/emoncms)* - Adds node to post to an [Emoncms](http://emoncms.org/) server.

**N/A** - *[26-rawserial](io/rawserial)* - Only really needed for Windows boxes without serialport npm module installed.
Uses a simple read of the serial port as a file to input data. You **must** set the baud rate etc externally *before* starting Node-RED. This node does not implement pooling of connections so only one instance of each port may be used - so in **or** out but **not** both.

### Social

**node-red-node-twilio** - *[56-twilio](social/twilio)* - Uses [Twilio](https://www.twilio.com/) service to send/receive text messages.

**node-red-node-dweetio** - *[55-dweetio](social/dweetio)* - Uses [dweetio](https://dweet.io/) to send/receive messages.

**node-red-node-nma** - *[57-nma](social/nma)* - Sends alerts to Android devices via the [Notify-My-Android](http://www.notifymyandroid.com/) app.

**node-red-node-notify** - *[57-notify](social/notify)* - Uses [Growl](http://growl.info/) to provide a desktop popup containing the payload. Only useful on the local Apple machine.

**node-red-node-prowl** - *[57-prowl](social/prowl)* - Uses [Prowl](http://www.prowlapp.com/) to push the payload to an Apple device that has the Prowl app installed.

**node-red-node-pushbullet** - *[57-pushbullet](social/pushbullet)* - Uses [PushBullet](https://www.pushbullet.com/) to push the payload to an Android device that has the [PushBullet](https://www.pushbullet.com/) app installed.

**node-red-node-pushover** - *[57-pushover](social/pushover)* - Sends alerts via [Pushover](https://pushover.net/).

**node-red-node-xmpp** - *[92-xmpp](social/xmpp)* - Connects to an XMPP server to send and receive messages.

**N/A** - *[69-mpd](social/music)* - MPD music control nodes. Output node expects payload to be a valid mpc command. Currently only simple commands that expect no reply are supported. Input node creates a payload object with Artist, Album, Title, Genre and Date.

**N/A** - *[79-snapchat](social/snapchat)* - Downloads [SnapChat](https://www.snapchat.com/) images from the account specified.

**N/A** - *[114-pusher](social/pusher)* - Publish-Subscribe to a [Pusher](http://pusher.com/) channel/event.

### Storage

**node-red-node-leveldb** - *[67-leveldb](storage/leveldb)* - Uses LevelDB for a simple key value pair database.

**node-red-node-mysql** - *[68-mysql](storage/mysql)* - Allows basic access to a MySQL database. This node uses the **query** operation against the configured database. This does allow both INSERTS and DELETES. By it's very nature it allows SQL injection... *so be careful out there...*

**node-red-node-sqlite** - *[sqlite](storage/sqlite)* - Supports read and write to a local sqlite database.

**node-red-node-ddb** - *[69-ddbout](storage/ddb)* - Support output to Amazon DynamoDB. (contributed by @wnagele)

**N/A** - *[110-postgres](storage/postgres)* - PostgreSql I/O node.

### Time

**node-red-node-suncalc** - *[79-suncalc](time)* - Uses the suncalc module to generate an output at sunrise and sunset based on a specified location. Several choices of definition of sunrise and sunset are available,

### Misc

**N/A** - *[99-sample](./)* - A sample node with more comments than most to try to help you get started without any other docs...
