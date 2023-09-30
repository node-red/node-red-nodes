
module.exports = function(RED) {
    "use strict";

    function convertDegreesMinutesSecondsToDecimals(degrees, minutes, seconds) {
        var result;
        result = degrees + (minutes / 60) + (seconds / 3600);
        return result;
    }

    function ExifNode(n) {
        RED.nodes.createNode(this,n);
        this.mode = n.mode || "normal";
        if (this.mode === "worldmap") { this.property = "payload.content"; }
        else { this.property = n.property || "payload"; }
        var node = this;
        var ExifImage = require('exif').ExifImage;

        /***
         * Extracts GPS location information from Exif data. If enough information is
         * provided, convert the Exif data into a pair of single floating point number
         * latitude/longitude data pairs. Populates msg.location with these.
         * Assumes that the msg object will always have exifData available as msg.exif.
         * Assume that the GPS data saved into Exif provides a valid value
         */
        function addMsgLocationDataFromExifGPSData(msg,val) {
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
            if (msg.location) {
                msg.location.arc = {
                    ranges: [100,300,500],
                    pan: gpsData.GPSImgDirection,
                    fov: (2 * Math.atan(36 / (2 * msg.exif.exif.FocalLengthIn35mmFormat)) * 180 / Math.PI),
                    color: '#aaaa00'
                }
                msg.location.icon = "fa-camera fa-lg";
                msg.location.iconColor = "orange";
                var na;
                var pop = "";
                if (val.hasOwnProperty("name")) { na = val.name; }
                else if (msg.hasOwnProperty("filename")) {
                    na = msg.filename.split('/').pop();
                    pop = "Timestamp: "+msg.exif.image.ModifyDate+"<br/>";
                }
                else { na = msg.exif.image.Make+"_"+msg.exif.image.ModifyDate; }
                msg.location.name = na;
                msg.location.layer = "Images";
                if (msg.exif.image.ImageDescription) {
                    pop = "Caption: "+msg.exif.image.ImageDescription+"<br/>"+pop;
                }
                pop += '<img width="280" src="data:image/jpeg;base64,'+val.toString("base64")+'"/>'
                if (msg.location.lat && msg.location.lon) {
                    pop += "<br/>Lat, Lon: "+msg.location.lat+", "+msg.location.lon;
                }
                msg.location.popup = pop;
            }
        }

        this.on("input", function(msg) {
            if (node.mode === "worldmap" && Buffer.isBuffer(msg.payload)) { node.property = "payload"; }
            else if (node.mode === "worldmap" && (msg.payload.action !== "file" || msg.payload.type.indexOf("image") === -1)) { return; } // in case worldmap-in not filtered.
            try {
                var value = RED.util.getMessageProperty(msg,node.property);
                if (value !== undefined) {
                    if (typeof value === "string") { // it must be a base64 encoded inline image type
                        if (value.indexOf('data:image') !== -1) {
                            value = new Buffer.from(value.replace(/^data:image\/[a-z]+;base64,/, ""), 'base64');
                        }
                    }
                    if (Buffer.isBuffer(value)) { // or a proper jpg buffer
                        new ExifImage({ image:value }, function (error, exifData) {
                            if (error) {
                                if (node.mode !== "worldmap") {
                                    node.log(error.toString());
                                }
                                else {
                                    msg.location = {name:msg.payload.name, lat:msg.payload.lat, lon:msg.payload.lon, layer:"Images", icon:"fa-camera fa-lg", draggable:true};
                                    msg.location.popup = '<img width="280" src="data:image\/png;base64,'+msg.payload.content.toString('base64')+'"/><br/>';
                                }
                            }
                            else {
                                if (exifData) {
                                    msg.exif = exifData;
                                    if ((exifData.hasOwnProperty("gps")) && (Object.keys(exifData.gps).length !== 0)) {
                                        addMsgLocationDataFromExifGPSData(msg,value);
                                    }
                                    //else { node.log("The incoming image did not contain Exif GPS data."); }
                                }
                                else {
                                    node.warn("The incoming image did not contain any Exif data, nothing to do.");
                                }
                            }
                            if (node.mode === "worldmap") {
                                msg.payload = msg.location;
                                delete msg.location;
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
                    node.warn("No input received, the Exif node cannot proceed, no messages sent.",msg);
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
