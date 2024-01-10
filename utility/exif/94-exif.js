
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
        var ExifReader = require('exifreader');

        /***
         * Extracts GPS location information from Exif data. If enough information is
         * provided, convert the Exif data into a pair of single floating point number
         * latitude/longitude data pairs. Populates msg.location with these.
         * Assumes that the msg object will always have exifData available as msg.exif.
         * Assume that the GPS data saved into Exif provides a valid value
         */
        function addMsgLocationDataFromExifGPSData(msg,val) {
            if (msg.exif.GPSAltitude) {
                /* istanbul ignore else */
                if (!msg.location) { msg.location = {}; }
                msg.location.alt = parseFloat(msg.exif.GPSAltitude);
            }
            if (msg.exif.GPSLatitudeRef && msg.exif.GPSLatitude && msg.exif.GPSLongitudeRef && msg.exif.GPSLongitude) { // location can be determined, OK
                if (!msg.location) { msg.location = {}; }
                msg.location.lat = msg.exif.GPSLatitude;
                msg.location.lon = msg.exif.GPSLongitude;
                if (msg.exif.GPSLatitudeRef == "South latitude") {
                    msg.location.lat *= -1;
                }
                if (msg.exif.GPSLongitudeRef == "West longitude") {
                    msg.location.lon *= -1;
                }
            }
            else {
                node.log("The location of this image cannot be determined safely so no location information has been added to the message.");
            }
            if (msg.location) {
                msg.location.arc = {
                    ranges: [100,300,500],
                    pan: msg.exif.GPSImgDirection ?? msg.exif.GimbalYawDegree,
                    fov: (2 * Math.atan(36 / (2 * msg.exif.FocalLengthIn35mmFilm)) * 180 / Math.PI),
                    color: '#aaaa00'
                }
                msg.location.icon = "fa-camera fa-lg";
                if (msg.exif.Make === "DJI") { msg.location.icon = "quad"; }
                if (msg.exif.Make === "Potensic") { msg.location.icon = "quad"; }
                if (msg.exif.Make === "Parrot") { msg.location.icon = "quad"; }
                msg.location.iconColor = "orange";
                var na;
                var pop = "";
                if (val.hasOwnProperty("name")) { na = val.name; }
                else if (msg.hasOwnProperty("filename")) {
                    na = msg.filename.split('/').pop();
                    pop = "Timestamp: "+msg.exif.DateTimeOriginal+"<br/>";
                }
                else { na = msg.exif.Make+"_"+msg.exif.DateTimeOriginal; }
                msg.location.name = na;
                msg.location.layer = "Images";
                if (msg.exif.ImageDescription) {
                    pop = "Caption: "+msg.exif.ImageDescription+"<br/>"+pop;
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
                        msg.exif = ExifReader.load(msg.payload);
                        for (const p in msg.exif) {
                            msg.exif[p] = msg.exif[p].description
                            if (!isNaN(Number(msg.exif[p])))  {
                                msg.exif[p] = Number(msg.exif[p])
                            }
                        }
                        if (msg.exif && msg.exif.hasOwnProperty("GPSLatitude") && msg.exif.hasOwnProperty("GPSLongitude")) {
                            addMsgLocationDataFromExifGPSData(msg,value);
                        }
                        if (node.mode === "worldmap") {
                            msg.payload = msg.location || {};
                            delete msg.location;
                        }
                        node.send(msg);
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
