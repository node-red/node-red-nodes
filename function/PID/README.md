node-red-node-pidcontrol
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that provides a simple PID controller.

Install
-------

Run the following command in the root directory of your Node-RED install - usually ~/.node-red

        npm install node-red-node-pidcontrol


Usage
-----

PID controller node.

This node ONLY expects a numeric **msg.payload** containing the current reading.

It will output the correction that needs to be applied in order to move to the preset **set point** value.

The damping factors are typically in the range 0 - 1.
See <a href="https://en.wikipedia.org/wiki/PID_controller" target="_new">Wikipedia</a> for more details on PID controllers.

The **set point** may be overridden by **msg.setpoint**. If you do so the edit box value can be used as the initial value.
