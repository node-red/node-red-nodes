node-red-node-what3words
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to convert positions to what3words...

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-what3words

Pre-reqs
--------

You will need a valid API key from <a href="http://what3words.com/">what3words</a>


Usage
-----

Uses What 3 Words to convert a location to 3 unique words.
and vice versa. Don't ask... just try it...

To convert position to words it requires

 - msg.location.lat
 - msg.location.lon

or

 - msg.payload  containing a string  lat,lon


To convert words to position it requires

 - msg.payload containing a string   unique.three.words


The API-key is stored in a separate credentials file.

**Note:** This is an online service and requires a live internet connection and a valid API key to work correctly.

See <a href="http://what3words.com/" target="_new">what3words</a> for more details.</p>

Example flow:

    [{"id":"f38eba15.0c7148","type":"inject","name":"","topic":"","payload":"calibrate.newlyweds.switched","payloadType":"string","repeat":"","crontab":"","once":false,"x":646,"y":319,"z":"cf058368.30fa8","wires":[["22d6b2a5.dd294e"]]},{"id":"22d6b2a5.dd294e","type":"what3words","title":"","name":"","x":881,"y":317,"z":"cf058368.30fa8","wires":[["9caf8aa8.635078"]]},{"id":"9caf8aa8.635078","type":"debug","name":"","active":true,"console":false,"complete":"true","x":1077,"y":315,"z":"cf058368.30fa8","wires":[]}]
