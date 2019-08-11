
module.exports = function(RED) {
    "use strict";
    var ExifImage = require('exif').ExifImage;

    function convertDegreesMinutesSecondsToDecimals(degrees, minutes, seconds) {
        var result;
        result = degrees + (minutes / 60) + (seconds / 3600);
        return result;
    }

    function ExifNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        /***
         * Extracts GPS location information from Exif data. If enough information is
         * provided, convert the Exif data into a pair of single floating point number
         * latitude/longitude data pairs. Populates msg.location with these.
         * Assumes that the msg object will always have exifData available as msg.exif.
         * Assume that the GPS data saved into Exif provides a valid value
         */
        function addMsgLocationDataFromExifGPSData(msg) {
            var gpsData = msg.exif.gps; // declaring variable purely to make checks more readable
            if (gpsData.GPSAltitude) {
                /* istanbul ignore else */
                if (!msg.location) { msg.location = {}; }
                msg.location.alt = gpsData.GPSAltitude;
            }
            if (gpsData.GPSLatitudeRef && gpsData.GPSLatitude && gpsData.GPSLongitudeRef && gpsData.GPSLongitude) { // location can be determined, OK
                // The data provided in Exif is in degrees, minutes, seconds, this is to be converted into a single floating point degree
                if (gpsData.GPSLatitude.length === 3) { // OK to convert latitude
                    if (gpsData.GPSLongitude.length === 3) { // OK to convert longitude

                        var latitude = convertDegreesMinutesSecondsToDecimals(gpsData.GPSLatitude[0], gpsData.GPSLatitude[1], gpsData.GPSLatitude[2]);
                        latitude = Math.round(latitude * 100000)/100000;    // 5dp is approx 1m resolution...
                        // (N)orth means positive latitude, (S)outh means negative latitude
                        if (gpsData.GPSLatitudeRef.toString() === 'S' || gpsData.GPSLatitudeRef.toString() === 's') {
                            latitude = latitude * -1;
                        }

                        var longitude = convertDegreesMinutesSecondsToDecimals(gpsData.GPSLongitude[0], gpsData.GPSLongitude[1], gpsData.GPSLongitude[2]);
                        longitude = Math.round(longitude * 100000)/100000;  // 5dp is approx 1m resolution...
                        // (E)ast means positive longitude, (W)est means negative longitude
                        if (gpsData.GPSLongitudeRef.toString() === 'W' || gpsData.GPSLongitudeRef.toString() === 'w') {
                            longitude = longitude * -1;
                        }
                        // Create location property if not exists
                        if (!msg.location) { msg.location = {}; }
                        msg.location.lat = latitude;
                        msg.location.lon = longitude;
                        return;
                    }
                    else {
                        node.log("Invalid longitude data, no location information has been added to the message.");
                    }
                }
                else {
                    node.log("Invalid latitude data, no location information has been added to the message.");
                }
            }
            else {
                node.log("The location of this image cannot be determined safely so no location information has been added to the message.");
            }
        }

        this.on("input", function(msg) {
            try {
                if (msg.payload) {
                    if (Buffer.isBuffer(msg.payload)) {
                        new ExifImage({ image : msg.payload }, function (error, exifData) {
                            if (error) {
                                node.log(error.toString());
                            }
                            else {
                                if (exifData) {
                                    msg.exif = exifData;
                                    if ((exifData.hasOwnProperty("gps")) && (Object.keys(exifData.gps).length !== 0)) {
                                        addMsgLocationDataFromExifGPSData(msg);
                                    }
                                    //else { node.log("The incoming image did not contain Exif GPS data."); }
                                }
                                else {
                                    node.warn("The incoming image did not contain any Exif data, nothing to do.");
                                }
                            }
                            node.send(msg);
                        });
                    }
                    else {
                        node.error("Invalid payload received, the Exif node cannot proceed, no messages sent.",msg);
                        return;
                    }
                }
                else {
                    node.error("No payload received, the Exif node cannot proceed, no messages sent.",msg);
                    return;
                }
            }
            catch (error) {
                node.error("An error occurred while extracting Exif information. Please check the log for details.",msg);
                node.log('Error: '+error.message);
                return;
            }
        });
    }
    RED.nodes.registerType("exif",ExifNode);
}
