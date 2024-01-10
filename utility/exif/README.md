node-red-node-exif
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to extract Exif information from JPEG images.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-exif

## Breaking Change - v1

This node now uses the more supported exifreader library so that it handles more features and recent exif spec updates, for example data associated with drones. The output message has consequently changed into a much flatter set of properties and thus breaks all existing (0.x) instances.

Usage
-----

Extracts <a href="http://en.wikipedia.org/wiki/Exchangeable_image_file_format">Exif</a> information from JPEG images.

This node expects an incoming JPEG image as a buffer. If Exif data is present, it extracts the data into a `msg.exif` object.

If the Exif data also contains location information this is extracted as `msg.location`.

`msg.payload` retains the original, unmodified image buffer.

You can set it into "worldmap" mode - in this mode the payload contains the "location" data, not the original image, but can be sent directly to a node-red-contrib-worldmap node for visualisation.
