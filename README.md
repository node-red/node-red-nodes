# Node-RED Nodes

A collection of nodes for [Node-RED](http://nodered.org). See below for a list.

## Installation

Most of these nodes are available as npm packages. See the list below for the
npm package names, or [search npm](https://www.npmjs.org/search?q=node-red-node-).

To install - change to your Node-RED user directory.

        cd ~/.node-red
        npm install node-red-node-{filename}

This repository acts as an overall store for these nodes - and is no longer
intended as a way to install them - unless you really do want some bloat.

To manually install using this repo:

1. cd into the `nodes` directory of Node-RED
2. Either:
    - download the zip of the repository and extract it
    - run `git clone https://github.com/node-red/node-red-nodes.git`
3. run `npm install` in any of the node subfolders to install individual node's dependencies

## Contributing

Now that we support npm installaton of nodes we recommend people post their own
nodes via [npm](https://www.npmjs.org/). Please read the
[packaging guide notes](http://nodered.org/docs/creating-nodes/packaging.html).

If you are an IBMer, please contact us directly as the contribution process
is slightly different.

For simple typos and single line fixes please just raise an issue pointing out
our mistakes. If you need to raise a pull request please read our
[contribution guidelines](https://github.com/node-red/node-red/blob/master/CONTRIBUTING.md)
before doing so.

## Copyright and license

Copyright 2013, 2015 IBM Corp. under [the Apache 2.0 license](LICENSE).

# Extra Node Information

**NPM name** - *File-link* - Description

### Analysis

**node-red-node-wordpos** - *[72-wordpos](analysis/wordpos)* - Analyses the payload and classifies the part-of-speech of each word. The resulting message has msg.pos added with the results. A word may appear in multiple categories (eg, 'great' is both a noun and an adjective).

**node-red-node-badwords** - *[74-swearfilter](analysis/swearfilter)* - Analyses the payload and tries to filter out any messages containing bad swear words. This only operates on payloads of type string. Everything else is blocked.

### Function

**node-red-node-smooth** - *[17-smooth](analysis/smooth)*  - A simple node to provide various functions across several previous values, including max, min, mean, high and low pass filters.

**node-red-node-rbe** - *[rbe](analysis/rbe)*  - A simple node to provide report by exception and deadband / bandgap capability for simple inputs.

**node-red-node-pidcontrol** - *[pidcontrol](analysis/pidcontrol)*  - A PID control node for numeric inputs - provides simple contoll loop feedback capability.

**node-red-node-random** - *[random](analysis/random)*  - A simple random number generator - can generate integers for x to y - or floats between x and y.

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

**node-red-node-makeymakey** - *[42-makey](hardware/makey)* - A Node-RED node to read from a [MakeyMakey](http://www.makeymakey.com/) input device.

**node-red-node-sensortag** - *[79-sensorTag](hardware/sensorTag)* - Reads data from the Ti Bluetooh Low Energy (BLE) SensorTag device.

**node-red-node-heatmiser** - *[100-heatmiser-in](hardware/heatmiser)* - Read and writes settings for temperature and frost protection to Heatmiser thermostats.

**N/A** - *[101-scanBLE](hardware/scanBLE)* - Scans for a particular Bluetooth Low Energy (BLE) device.

### I/O

**node-red-node-stomp** - *[18-stomp](io/stomp)* - A Node-RED node to publish and subscribe to and from a [STOMP server](https://stomp.github.io/implementations.html#STOMP_Servers).

**node-red-node-wol** - *[39-wol](io/wol)* - Sends a Wake-On-LAN magic packet to the mac address specified. You may instead set msg.mac to dynamically set the target device mac to wake up.

**node-red-node-ping** - *[88-ping](io/ping)* - Pings a machine and returns the trip time in mS. Returns false if no response received within 3 seconds, or if the host is unresolveable. Default ping is every 20 seconds but can be configured.

**node-red-node-mdns** - *[mdns](io/mdns)* - discovers other Avahi/Bonjour services on the network.

**node-red-node-mqlight** - *[mqlight](io/mqlight)* - Adds nodes to send and receive using MQlight.

**node-red-node-snmp** - *[snmp](io/snmp)* - Adds simple snmp receivers for single OIDs or OID tables.

**node-red-node-emoncms** - *[88-emoncms](io/emoncms)* - Adds node to post to an [Emoncms](http://emoncms.org/) server.

### Parsers

**node-red-node-msgpack** - *[70-msgpack.js](parsers/msgpack)* - Converts a payload to/from msgpack binary packed format.

**node-red-node-base64** - *[70-base64.js](parsers/base64)* - Converts a payload to/from base64 encoded format.

**node-red-node-geohash** - *[70-geohash.js](parsers/geohash)* - Converts a lat, lon payload to/from geohash format.

### Social

**node-red-node-twilio** - *[56-twilio](social/twilio)* - Uses [Twilio](https://www.twilio.com/) service to send/receive text messages.

**node-red-node-dweetio** - *[55-dweetio](social/dweetio)* - Uses [dweetio](https://dweet.io/) to send/receive messages.

**node-red-node-nma** - *[57-nma](social/nma)* - Sends alerts to Android devices via the [Notify-My-Android](http://www.notifymyandroid.com/) app.

**node-red-node-notify** - *[57-notify](social/notify)* - Uses [Growl](http://growl.info/) to provide a desktop popup containing the payload. Only useful on the local Apple machine.

**node-red-node-prowl** - *[57-prowl](social/prowl)* - Uses [Prowl](http://www.prowlapp.com/) to push the payload to an Apple device that has the Prowl app installed.

**node-red-node-pushbullet** - *[57-pushbullet](social/pushbullet)* - Uses [PushBullet](https://www.pushbullet.com/) to push the payload to an Android device that has the [PushBullet](https://www.pushbullet.com/) app installed.

**node-red-node-pushover** - *[57-pushover](social/pushover)* - Sends alerts via [Pushover](https://pushover.net/).

**node-red-node-xmpp** - *[92-xmpp](social/xmpp)* - Connects to an XMPP server to send and receive messages.

**node-red-node-pusher** - *[114-pusher](social/pusher)* - Publish-Subscribe to a [Pusher](http://pusher.com/) channel/event.

### Storage

**node-red-node-leveldb** - *[67-leveldb](storage/leveldb)* - Uses LevelDB for a simple key value pair database.

**node-red-node-mysql** - *[68-mysql](storage/mysql)* - Allows basic access to a MySQL database. This node uses the **query** operation against the configured database. This does allow both INSERTS and DELETES. By it's very nature it allows SQL injection... *so be careful out there...*

**node-red-node-sqlite** - *[sqlite](storage/sqlite)* - Supports read and write to a local sqlite database.

### Time

**node-red-node-suncalc** - *[79-suncalc](time/suncalc)* - Uses the suncalc module to generate an output at sunrise and sunset based on a specified location. Several choices of definition of sunrise and sunset are available,

### Utility

**node-red-node-exif** - *[94-exif](utility/exif)* - Extracts GPS and other EXIF information from a passed in jpeg image,

**node-red-node-daemon** - *[daemon](utility/daemon)* - starts up (calls) a long running system program and pipes STDIN, STDOUT and STDERR to and from that process. Good for monitoring long running command line applications,

### Misc

**N/A** - *[99-sample](./)* - A sample node with more comments than most to try to help you get started without any other docs...
