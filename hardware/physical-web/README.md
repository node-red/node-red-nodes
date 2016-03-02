node-red-node-physical-web
==========================

Nodes to allow Node-RED to act as an Eddystone BLE beacon.

Prerequisites
-------------

You will need a suitable Bluetooth Low Energy (BLE) stack and drivers for your hardware
- for example Bluez 5.2.x or better.

#### Raspberry Pi

Install Bluetooth drivers and bluez stack, and set executeable by non-root user

    sudo apt-get install libbluetooth-dev libudev-dev pi-bluetooth
    sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

#### Linux / OSX / Windows

Follow **just** the pre-reqs for [noble here](https://github.com/sandeepmistry/noble).

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-physical-web

Then on Linux follow these instructions:

https://github.com/sandeepmistry/bleno#running-on-linux


Usage
-----

### Physical-Web Out

A node to allow Node-RED to act as an Eddystone beacon broadcasting URLs

The config window lets you set the initial URL, announcement power and period for the Eddystone.

Any messages received will update the advertised URL from the `msg.payload`

### Physical-Web In

A node to scan for local Eddystones and output information about discovered URLs and TLM data.

Two types of messages will be emitted:

- **URL**
    - *type* - Eddystone type
    - *txPower* - Received power at 0m in dBm
    - *url* - The URL the beacon is broadcasting
    - *tlm* - TLM data, if the device is interleaving broadcasts
    - *rssi* - RSSI of the beacon
    - *distance* - Estimated distance to the beacon

- **UID**
    - *type* - Eddystone type
    - *txPower* - Received power at 0m in dBm
    - *namespace* - 10-byte ID of namespace
    - *instance* - 6-byte ID instance
    - *tlm* - TLM data, if the device is interleaving broadcasts
    - *rssi* - RSSI of the beacon
    - *distance* - Estimated distance to the beacon

Where the tlm data will be in the following format

- **tlm**
    - *version* - TLM version
    - *vbatt* - Battery Voltage
    - *temp* - Temperature
    - *advCnt* - Advertising PDU count
    - *secCnt* - Time since power on or reboot
    - *rssi* - RSSI of the beacon
    - *distance* - Estimated distance to the beacon
