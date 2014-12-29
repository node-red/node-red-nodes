node-red-node-geohash
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to encode and decode lat,lon pairs to a <h href="http://en.wikipedia.org/wiki/Geohash">geohash</a> string.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-geohash


Usage
-----

This function encodes a lat,lon string to and from a geohash.

If the **msg.payload** is a string it tries to see if it's a geohash -
    if so it tries to decode it and outputs a payload object containing

 - latitude
 - longitude
 - errorlatitude
 - error.longitude

If the **msg.payload** is an object with properties **lat** or **latitude** and **lon** or **longitude**  - it will add a <b>geohash</b> property to the payload.

The precision can be set by **msg.payload.precision** from 1 to 9.


Example flow
------------

<pre><code>[{"id":"60ebfc45.9f1404","type":"function","name":"","func":"msg.payload = {lat:51,lon:-1,precision:5};\nreturn msg;","outputs":1,"x":281,"y":485,"z":"385bdf8b.c7a42","wires":[["6f1c5357.90e3ac"]]},{"id":"6f1c5357.90e3ac","type":"geohash","name":"","x":415.5,"y":420,"z":"385bdf8b.c7a42","wires":[["71a94378.8e56bc"]]},{"id":"52763c46.ad89c4","type":"inject","name":"","topic":"","payload":"51.05,-1.05","payloadType":"string","repeat":"","crontab":"","once":false,"x":165.5,"y":337,"z":"385bdf8b.c7a42","wires":[["7b08247.f84f7dc"]]},{"id":"7b08247.f84f7dc","type":"geohash","name":"","x":360.5,"y":337,"z":"385bdf8b.c7a42","wires":[["6f1c5357.90e3ac","893e37b7.76c1c8"]]},{"id":"6fec77c4.901388","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"x":155,"y":397,"z":"385bdf8b.c7a42","wires":[["60ebfc45.9f1404"]]},{"id":"893e37b7.76c1c8","type":"debug","name":"","active":true,"console":"false","complete":"false","x":535,"y":337,"z":"385bdf8b.c7a42","wires":[]},{"id":"71a94378.8e56bc","type":"debug","name":"","active":true,"console":"false","complete":"false","x":590,"y":420,"z":"385bdf8b.c7a42","wires":[]}]</code></pre>
