node-red-contrib-heatmiser
==========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to control and poll a <a href="http://www.heatmiser.com/">HeatMiser</a> thermostat.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-contrib-heatmiser


Usage
-----

###Input node###

Expects a **msg.payload** with a JSON object that contains settings for the Heatmiser thermostat

**msg.payload** can currently be either a heating boost option, or a run mode, as below:

####Heating boost####

    {heating: {target: TARGET_TEMPERATURE, hold: MINUTES_TO_STAY_ON_FOR}}

####Run mode####

    {runmode:"frost"}
    {runmode:"heating"}


###Output node.###

Will read and send a status update at a configurable time interval. This is set to every 30 minutes by default.
