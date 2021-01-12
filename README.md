# Node-RED Nodes

A collection of nodes for [Node-RED](http://nodered.org). See below for a list.

## Installation

All of these nodes are available as individual npm packages. See the list below for the
npm package names, or [search npm](https://www.npmjs.org/search?q=node-red-node-).

This repository acts as an overall store for these nodes - and is not
intended as a way to install them - unless you really do want some development.

To install - either use the manage palette option in the editor, or change to your Node-RED user directory.

        cd ~/.node-red
        npm install node-red-node-{filename}

To manually install using this repo:

1. cd into the `nodes` directory of Node-RED
2. Either:
    - download the zip of the repository and extract it
    - run `git clone https://github.com/node-red/node-red-nodes.git`
3. run `npm install` in any of the node subfolders to install individual node's dependencies

## Running Tests

Node.js v6 or newer is required. To run tests on all of the nodes you will need the node-red runtime:

    npm i node-red-nodes
    npm test

## Contributing

Now that we support npm installation of nodes we recommend people post their own
nodes via [npm](https://www.npmjs.org/). Please read the
[packaging guide notes](http://nodered.org/docs/creating-nodes/packaging.html).

For simple typos and single line fixes please just raise an issue pointing out
our mistakes. If you need to raise a pull request please read our
[contribution guidelines](https://github.com/node-red/node-red/blob/master/CONTRIBUTING.md)
before doing so.

## Copyright and license

Copyright JS Foundation and other contributors, http://js.foundation under [the Apache 2.0 license](LICENSE).

# Extra Node Information

**NPM name** - *File-link* - Description

### Misc

**N/A** - *[99-sample](./)* - A sample node with more comments than most to try to help you get started without any other docs...

### Analysis

**node-red-node-badwords** - *[74-swearfilter](analysis/swearfilter)* - Analyses the payload and tries to filter out any messages containing bad swear words. This only operates on payloads of type string. Everything else is blocked.

**node-red-node-wordpos** - *[72-wordpos](analysis/wordpos)* - Analyses the payload and classifies the part-of-speech of each word. The resulting message has msg.pos added with the results. A word may appear in multiple categories (eg, 'great' is both a noun and an adjective).

### Function

**node-red-node-datagenerater** - *[datagenerator](function/datagenerator)*  - A node that can generate dummy data in various formats, names, addresses, emails, numbers, words, etc

**node-red-node-pidcontrol** - *[pidcontrol](function/PID)*  - A PID control node for numeric inputs - provides simple contoll loop feedback capability.

**node-red-node-random** - *[random](function/random)*  - A simple random number generator - can generate integers for x to y - or floats between x and y.

**node-red-node-rbe** - *[rbe](function/rbe)*  - A simple node to provide report by exception and deadband / bandgap capability for simple inputs.

**node-red-node-smooth** - *[17-smooth](function/smooth)*  - A simple node to provide various functions across several previous values, including max, min, mean, high and low pass filters.


### Hardware

**node-red-node-arduino** - *[35-arduino](hardware/Arduino)* - A collection of analogue & digital input & output nodes for the Arduino board - uses firmata protocol to talk to the board.

**node-red-node-beaglebone** - *[145-BBB-hardware](hardware/BBB)* - A collection of analogue & digital input & output nodes for the [Beaglebone Black](http://beagleboard.org/black).

**node-red-node-blink1** - *[77-blink1](hardware/blink1)* - Provides support for the [Blink1](http://blink1.thingm.com/) USB LED from ThingM.

**node-red-node-blinkstick** - *[76-blinkstick](hardware/blinkstick)* - Provides support for the [BlinkStick](http://www.blinkstick.com/) USB LED device.

**node-red-node-digirgb** - *[78-digiRGB](hardware/digiRGB)* - Provides support for the DigiSpark RGB USB LED.

**node-red-node-heatmiser** - *[100-heatmiser-in](hardware/heatmiser)* - Read and writes settings for temperature and frost protection to Heatmiser thermostats.

**node-red-node-intel-galileo** - *[mraa-spio](hardware/intel)* - A collection of analogue & digital input & output nodes for the Intel Galileo and Edison.

**node-red-node-ledborg** - *[78-ledborg](hardware/LEDborg)* - A simple driver for the [LEDborg](https://www.piborg.org/ledborg) plug on module for Raspberry Pi.

**node-red-node-makeymakey** - *[42-makey](hardware/makey)* - A Node-RED node to read from a [MakeyMakey](http://www.makeymakey.com/) input device.

**node-red-node-pi-gpiod** - *[pigpiod](hardware/pigpiod)* - An alternative to the default PI GPIO nodes that allows remote access - so a host machine can access a remote Pi (via network) and is better for driving multiple servos.

**node-red-node-pi-mcp3008** - *[pimcp3008](hardware/mcp3008)* - Allows A Raspberry Pi to node to read from MCP300x series Analogue to Digital Converter chips via the SPI bus.

**node-red-node-pi-neopixel** - *[neopixel](hardware/neopixel)* - Allows A Raspberry Pi to drive a strip of NeoPixels directly.

**node-red-node-pi-unicorn-hat** - *[unicorn](hardware/unicorn)* - Lets a Raspbeery Pi control a Pimorini Unicorn HAT 8x8 LED display.

**node-red-node-pibrella** - *[38-rpi-pibrella](hardware/Pibrella)* - Controls a [Pibrella](http://pibrella.com/) add-on board for a Raspberry-Pi.

**node-red-node-piface** - *[37-rpi-piface](hardware/PiFace)* - Adds support for the [PiFace](http://www.piface.org.uk/) interface module for Raspberry Pi.

**node-red-node-piliter** - *[39-rpi-piliter](hardware/PiLiter)* - Controls a Pimorini Pi-LITEr 8 LED add-on board for a Raspberry-Pi.

**node-red-node-sensortag** - *[79-sensorTag](hardware/sensorTag)* - Reads data from the Ti Bluetooh Low Energy (BLE) SensorTag device.

**node-red-node-wemo** - *[60-wemo](hardware/wemo)* - Basic node to drive a [WeMo](http://www.belkin.com/us/Products/home-automation/c/wemo-home-automation/) socket and switch. Does not use discovery.

**N/A** - *[101-scanBLE](hardware/scanBLE)* - Scans for a particular Bluetooth Low Energy (BLE) device.

### I/O

**node-red-node-discovery** - *[mdns](io/mdns)* - discovers other Avahi/Bonjour services on the network.

**node-red-node-emoncms** - *[88-emoncms](io/emoncms)* - Adds node to post to an [Emoncms](http://emoncms.org/) server.

**node-red-node-mqlight** - *[mqlight](io/mqlight)* - Adds nodes to send and receive using MQlight.

**node-red-node-ping** - *[88-ping](io/ping)* - Pings a machine and returns the trip time in mS. Returns false if no response received within 3 seconds, or if the host is unresolveable. Default ping is every 20 seconds but can be configured.

**node-red-node-serialport** - *[25-serial](io/serialport)* - Node to send messages to and receive messages from a physical serial port.

**node-red-node-snmp** - *[snmp](io/snmp)* - Adds simple snmp receivers for single OIDs or OID tables.

**node-red-node-stomp** - *[18-stomp](io/stomp)* - A Node-RED node to publish and subscribe to and from a [STOMP server](https://stomp.github.io/implementations.html#STOMP_Servers).

**node-red-node-wol** - *[39-wol](io/wol)* - Sends a Wake-On-LAN magic packet to the mac address specified. You may instead set msg.mac to dynamically set the target device mac to wake up.


### Parsers

**node-red-node-base64** - *[70-base64.js](parsers/base64)* - Converts a payload to/from base64 encoded format.

**node-red-node-geohash** - *[70-geohash.js](parsers/geohash)* - Converts a lat, lon payload to/from geohash format.

**node-red-node-msgpack** - *[70-msgpack.js](parsers/msgpack)* - Converts a payload to/from msgpack binary packed format.

**node-red-node-what3words** - *[what3words.js](parsers/what3words)* - Encodes or Decodes a lat, lon position into what3words text format.

### Social

**node-red-node-dweetio** - *[55-dweetio](social/dweetio)* - Uses [dweetio](https://dweet.io/) to send/receive messages.

**node-red-node-email** - *[61-email](social/email)* - Sends and receives simple emails from services like gmail or smtp or imap servers.

**node-red-node-feedparser** - *[32-feedparse](social/feedparser)* - Reads messages from an atom or rss feed.

**node-red-node-irc** - *[91-irc](social/irc)* - Connects to an IRC server to send and receive messages.

**node-red-node-nma** - *[57-nma](social/nma)* - DEPRECATED as NMA closed down operations.

**node-red-node-notify** - *[57-notify](social/notify)* - Uses [Growl](http://growl.info/) to provide a desktop popup containing the payload. Only useful on the local Apple machine.

**node-red-node-prowl** - *[57-prowl](social/prowl)* - Uses [Prowl](http://www.prowlapp.com/) to push the payload to an Apple device that has the Prowl app installed.

**node-red-node-pushbullet** - *[57-pushbullet](social/pushbullet)* - Uses [PushBullet](https://www.pushbullet.com/) to push the payload to an Android device that has the [PushBullet](https://www.pushbullet.com/) app installed.

**node-red-node-pusher** - *[114-pusher](social/pusher)* - Publish-Subscribe to a [Pusher](http://pusher.com/) channel/event.

**node-red-node-pushover** - *[57-pushover](social/pushover)* - Sends alerts via [Pushover](https://pushover.net/).

**node-red-node-twilio** - *[56-twilio](social/twilio)* - Uses [Twilio](https://www.twilio.com/) service to send/receive text messages.

**node-red-node-twitter** - *[27-twitter](social/twitter)* - Listens to Twitter feeds and can also send tweets. (**NOTE**: this will break soon when Twitter remove their streaming API)

**node-red-node-xmpp** - *[92-xmpp](social/xmpp)* - Connects to an XMPP server to send and receive messages.


### Storage

**node-red-node-leveldb** - *[67-leveldb](storage/leveldb)* - Uses LevelDB for a simple key value pair database.

**node-red-node-mysql** - *[68-mysql](storage/mysql)* - Allows basic access to a MySQL database. This node uses the **query** operation against the configured database. This does allow both INSERTS and DELETES. By it's very nature it allows SQL injection... *so be careful out there...*

**node-red-node-sqlite** - *[sqlite](storage/sqlite)* - Supports read and write to a local sqlite database.

### Time

**node-red-node-suncalc** - *[79-suncalc](time/suncalc)* - Uses the suncalc module to generate an output at sunrise and sunset based on a specified location. Several choices of definition of sunrise and sunset are available.

**node-red-node-timeswitch** - *[timeswitch](time/timeswitch)* - Lets the user set simple repeating timers for example for simple heating control, etc.

### Utility

**node-red-node-daemon** - *[daemon](utility/daemon)* - starts up (calls) a long running system program and pipes STDIN, STDOUT and STDERR to and from that process. Good for monitoring long running command line applications,

**node-red-node-exif** - *[94-exif](utility/exif)* - Extracts GPS and other EXIF information from a passed in jpeg image,
