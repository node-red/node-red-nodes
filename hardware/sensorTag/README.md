node-red-node-sensortag
=======================

This node adds support to Node-RED to read from the Texas Instruments SensorTag.

The SensorTag is a Bluetooth LE device hosting the following sensors:
* Ambient & ir Temperature
* Barometric Pressure
* Humidity
* 3 axis Accelerometer
* 3 axis Magnetometer
* 3 axis Gyroscope
* 2 push Buttons

The config node allows the user to enable/disable any of the sensors listed above. The readings from 
these sensors will be sent as a JSON object payload with the sensor name appended to the topic provided:

* Temperature - { topic: [topic_prefix]/temperature, payload: { ambient: 21.2, object: 33.0 } } 
* Barometric Pressure - { topic: [topic_prefix]/pressure, payload: { pres: 1000.1 } }
* Humidity - { topic: [topic_prefix]/humidity , payload: { temp: 21.2, humidity: 88} }
* Accelerometer - { topic: [topic_prefix]/ , payload: { x:0.0, y:9.8, z:0.0 } }
* Magnetometer - { topic: [topic_prefix]/ , payload: { x:0.0, y:0.0, z:0.0 } }
* Gyroscope - { topic: [topic_prefix]/ , payload: { x:0.0, y:0.0, z:0.0 } }
* Buttons - { topic: [topic_prefix]/ , payload: { left: "down", right: "up"} }

The sensorTag library used by this node only supports using 1 SensorTag at once.

**NOTE:** Node-RED needs to be run as root inorder or access the Linux Bluetooth 4.0 system calls