node-red-node-arduino
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to talk to an
Arduino running standard firmata 2.2 or better.

Install
-------

Either use the Menu - Manage Palette option or run the following command in your Node-RED user directory - typically `~/.node-red`

        npm i --unsafe-perm node-red-node-arduino

Usage
-----

The Firmata firmware must be loaded into the Arduino.

See the [main documentation](http://nodered.org/docs/hardware/arduino.html) for
details and examples of how to use this node.

### Input Node

Connects to local Arduino and monitors the selected pin for changes.

You can select either **Digital**, **Pullup**, **Analogue**, or **String** input type.
Outputs the value read as `msg.payload` and the pin number as `msg.topic`.

It only outputs on a change of value - fine for digital inputs, but you can get a lot of data from analogue pins which you must then handle. For example you could use a `delay` node set to rate limit and drop intermediate values, or an `rbe` node to only report when it changes by a certain amount.

### Output Node

Connects to local Arduino and writes to the selected pin.

You can select

 - **Digital** - accepts 0, 1, true, false, on, off
 - **Analogue** (PWM) - accepts Integer 0 to 255
 - **Servo** - accepts Integer 0 - 180
 - **String** - to send a *String* to the Arduino

Expects a numeric value in `msg.payload`. The pin number is set in the properties panel.

*Note* - some servos will not travel a full 180 degree range so may only accept 30 - 150 degrees for example.
Please use the `range` node to scale the input appropriately.

### Example

Simple flow to blink Pin 13

        [{"id":"d7663aaf.47194","type":"arduino-board","device":""},{"id":"dae8234f.2517e","type":"inject","name":"0.5s tick","topic":"","payload":"","payloadType":"date","repeat":"0.5","crontab":"","once":false,"x":150,"y":100,"z":"359a4b52.ca65b4","wires":[["56a6f8f2.a95908"]]},{"id":"2db61802.d249e8","type":"arduino out","name":"","pin":"13","state":"OUTPUT","arduino":"d7663aaf.47194","x":570.5,"y":100,"z":"359a4b52.ca65b4","wires":[]},{"id":"56a6f8f2.a95908","type":"function","name":"Toggle output on input","func":"\n// If it does exist make it the inverse of what it was or else initialise it to false\n// (context variables persist between calls to the function)\ncontext.level = !context.level || false;\n\n// set the payload to the level and return\nmsg.payload = context.level;\nreturn msg;","outputs":1,"noerr":0,"x":358,"y":100,"z":"359a4b52.ca65b4","wires":[["2db61802.d249e8"]]}]
