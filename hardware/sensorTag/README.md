node-red-node-sensortag
=======================

This node adds support to Node-RED to read from the Texas Instruments SensorTag.

Pre-requisites
--------------

You will need a suitable Bluetooth Low Energy (BLE) stack and drivers for your hardware
- for example Bluez 5.2.x or better.

#### Raspberry Pi

Install Bluetooth drivers and bluez stack, and set executable by non-root user

    sudo apt-get install libbluetooth-dev libudev-dev pi-bluetooth
    sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)


Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i node-red-node-sensortag


Usage
-----

The SensorTag is a Bluetooth LE device hosting the following sensors:

* Humidity and Temperature
* Ambient & IR Temperatures
* Barometric Pressure
* 3 axis Accelerometer
* 3 axis Gyroscope
* 3 axis Magnetometer
* 2 push Buttons
* 1 Luxometer (CC2650 version only)

The config node allows the user to enable/disable any of the sensors listed above. The readings from
these sensors will be sent as a JSON object payload with the sensor name appended to the topic provided:

* Humidity - { topic: [topic_prefix]/humidity , payload: { temp: 21.2, humidity: 88} }
* Temperature - { topic: [topic_prefix]/temperature, payload: { ambient: 21.2, object: 33.0 } }
* Barometric Pressure - { topic: [topic_prefix]/pressure, payload: { pres: 1000 } }
* Accelerometer - { topic: [topic_prefix]/accelerometer , payload: { x:0.0, y:9.8, z:0.0 } }
* Magnetometer - { topic: [topic_prefix]/magnetometer , payload: { x:0.0, y:0.0, z:0.0 } }
* Gyroscope - { topic: [topic_prefix]/gyroscope , payload: { x:0.0, y:0.0, z:0.0 } }
* Luxometer - { topic: [topic_prefix]/luxometer , payload: { lux: 212 } }
* Buttons - { topic: [topic_prefix]/keys , payload: { left: true, right: false} }

**Note**: This sensorTag library only supports using 1 SensorTag at a time.
