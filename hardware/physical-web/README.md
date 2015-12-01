# node-red-node-physical-web

install with

npm install node-red-node-physical-web

Then on Linux follow these instrucations:

https://github.com/sandeepmistry/bleno#running-on-linux


## Physical-Web out

A node to allow Node-RED to act as an Eddystone beacon broadcasting URLs

### Config

The config window lets you set the inital URL, anouncement power and period for the Eddystone.

Any messages received will update the advertised URL from the msg.payload

## Physical-Web in

A node to scan for local Eddystones and output information about discovered URLs and TLM data.

Two types of messages will be emitted:

- **URL** -
    - *type* - Eddystone type
    - *txPower* - Received power at 0m in dBm
    - *url* - The URL the beacon is broadcasting
    - *tlm* - TLM data, if the device is interleaving broadcasts
    - *rssi* - RSSI of the beacon
    - *distance* - Estimated distance to the beacon
- **UID** -
    - *type* - Eddystone type
    - *txPower* - Received power at 0m in dBm
    - *namespace* - 10-byte ID of namspace
    - *instance* - 6-byte ID insance
    - *tlm* - TLM data, if the device is interleaving broadcasts
    - *rssi* - RSSI of the beacon
    - *distance* - Estimated distance to the beacon

Where the tlm data will be in the following format

- **tlm** -
    - *version* - TLM version
    - *vbatt* - Battery Voltage
    - *temp* - Temperature
    - *advCnt* - Advertising PDU count
    - *secCnt* - Time since power on or reboot
    - *rssi* - RSSI of the beacon
    - *distance* - Estimated distance to the beacon
