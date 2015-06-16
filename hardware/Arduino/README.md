node-red-node-arduino
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to talk to an Arduino running firmata.

**Note** : This is the same node as was in the core of Node-RED.
As of v0.10.8 you will need to install it from here if still required.

Install
-------

Run the following command in the root directory of your Node-RED install, usually
this is ~/.node-red .

        npm install node-red-node-arduino


Usage
-----

The Firmata firmware must be loaded into the Arduino.

See the [main documentation](http://nodered.org/docs/hardware/arduino.html) for
details and examples of how to use this node.

###Input Node

Connects to local Arduino and monitors the selected pin for changes.

You can select either Digital or Analogue input. Outputs the value read as **msg.payload** and the pin number as **msg.topic**.

It only outputs on a change of value - fine for digital inputs, but you can get a lot of data from analogue pins which you must then handle.

You can set the sample rate in ms from 20 to 65535.

###Output Node

Connects to local Arduino and writes to the selected pin.

You can select Digital, Analogue (PWM) or Servo type outputs. Expects a numeric value in **msg.payload**. The pin number is set in the properties panel.

###Example

Simple flow to blink Pin 13

        [{"id":"d7663aaf.47194","type":"arduino-board","device":""},{"id":"dae8234f.2517e","type":"inject","name":"0.5s tick","topic":"","payload":"","payloadType":"date","repeat":"0.5","crontab":"","once":false,"x":150,"y":100,"z":"359a4b52.ca65b4","wires":[["56a6f8f2.a95908"]]},{"id":"2db61802.d249e8","type":"arduino out","name":"","pin":"13","state":"OUTPUT","arduino":"d7663aaf.47194","x":570.5,"y":100,"z":"359a4b52.ca65b4","wires":[]},{"id":"56a6f8f2.a95908","type":"function","name":"Toggle output on input","func":"\n// If it does exist make it the inverse of what it was or else initialise it to false\n// (context variables persist between calls to the function)\ncontext.level = !context.level || false;\n\n// set the payload to the level and return\nmsg.payload = context.level;\nreturn msg;","outputs":1,"noerr":0,"x":358,"y":100,"z":"359a4b52.ca65b4","wires":[["2db61802.d249e8"]]}]
