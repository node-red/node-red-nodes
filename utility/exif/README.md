node-red-node-exif
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to extract Exif information from JPEG images.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-exif


Usage
-----

Extracts <a href="http://en.wikipedia.org/wiki/Exchangeable_image_file_format">Exif</a> information from JPEG images.

This node expects an incoming JPEG image as a buffer. If Exif data is present, it extracts the data into a `msg.exif` object.

If the Exif data also contains location information this is extracted as `msg.location`.

`msg.payload` retains the original, unmodified image buffer.
