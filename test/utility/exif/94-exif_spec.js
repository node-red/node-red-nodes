/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require("should");
var sinon = require('sinon');
//var fs = require("fs");
var helper = require('../../../test/helper.js');
var exifNode = require('../../../utility/exif/94-exif.js');

describe('exif node', function() {
    "use strict";

    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload().then(function() {
            helper.stopServer(done);
        });
    });

    it('extracts location data from Exif data of JPEG', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        // the jpg file is a single black dot but it was originally a photo taken at IBM Hursley
        //console.log(process.cwd());
        //var data = fs.readFileSync("test/utility/exif/exif_test_image.jpg", null); // extracting genuine exif data to be fed back as the result of the stubbed ExifImage constructor
        //var data = fs.readFileSync("exif_test_image.jpg", null); // extracting genuine exif data to be fed back as the result of the stubbed ExifImage constructor
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        var gpsmsg = { gps: { GPSLatitudeRef: 'N',
            GPSLatitude: [ 50, 57, 22.4697 ],
            GPSLongitudeRef: 'W',
            GPSLongitude: [ 1, 22, 1.2467 ],
            GPSAltitudeRef: 0,
            GPSAltitude: 50,
            GPSTimeStamp: [ 7, 32, 2 ],
            GPSImgDirectionRef: 'M',
            GPSImgDirection: 267,
            GPSProcessingMethod: 'ASCII\u0000\u0000\u0000FUSED',
            GPSDateStamp: '2014:06:10' }
        };
        var spy = sinon.stub(exif, 'ExifImage', function(arg1,arg2) { arg2(null,gpsmsg); });

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            helperNode1.on("input", function(msg) {
                msg.location.lat.should.equal(50.95624); // this data is stored in the jpg file
                msg.location.lon.should.equal(-1.36701);
                exif.ExifImage.restore();
                done();
            });

            exifNode1.receive({payload:new Buffer("hello")});
        });
    });

    it('extracts location data in Southern and Eastern hemispheres', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        // the jpg file is a single black dot but it was originally a photo taken at IBM Hursley
        //console.log(process.cwd());
        //var data = fs.readFileSync("test/utility/exif/exif_test_image.jpg", null); // extracting genuine exif data to be fed back as the result of the stubbed ExifImage constructor
        //var data = fs.readFileSync("exif_test_image.jpg", null); // extracting genuine exif data to be fed back as the result of the stubbed ExifImage constructor
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        var gpsmsg = { gps: { GPSLatitudeRef: 'S',
            GPSLatitude: [ 50, 57, 22.4697 ],
            GPSLongitudeRef: 'E',
            GPSLongitude: [ 1, 22, 1.2467 ],
            GPSTimeStamp: [ 7, 32, 2 ],
            GPSImgDirectionRef: 'M',
            GPSImgDirection: 267,
            GPSProcessingMethod: 'ASCII\u0000\u0000\u0000FUSED',
            GPSDateStamp: '2014:06:10' }
        };
        var spy = sinon.stub(exif, 'ExifImage', function(arg1,arg2) { arg2(null,gpsmsg); });

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            helperNode1.on("input", function(msg) {
                msg.location.lat.should.equal(-50.95624); // this data is stored in the jpg file
                msg.location.lon.should.equal(1.36701);
                exif.ExifImage.restore();
                done();
            });

            exifNode1.receive({payload:new Buffer("hello")});
        });
    });

    it('should report if no data found', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        // the jpg file is a single black dot but it was originally a photo taken at IBM Hursley
        //console.log(process.cwd());
        //var data = fs.readFileSync("test/utility/exif/exif_test_image2.jpg", null); // extracting genuine exif data to be fed back as the result of the stubbed ExifImage constructor
        //var data = fs.readFileSync("exif_test_image2.jpg", null); // extracting genuine exif data to be fed back as the result of the stubbed ExifImage constructor
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        var gpsmsg = {};
        var spy = sinon.stub(exif, 'ExifImage',
            function(arg1,arg2){
                arg2(null,gpsmsg);
            });

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            setTimeout(function() {
                var logEvents = helper.log().args.filter(function(evt) {
                    return evt[0].type == "exif";
                });
                logEvents.should.have.length(1);
                logEvents[0][0].should.have.a.property('msg');
                logEvents[0][0].msg.toString().should.startWith("The incoming image did not contain Exif GPS");
                exif.ExifImage.restore();
                done();
            },150);

            exifNode1.receive({payload:new Buffer("hello")});
        });
    });

    it('should report if not a jpeg', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        // this time just use a buffer that isn't an jpeg image
        var data = new Buffer("hello");
        var eD;
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            setTimeout(function() {
                var logEvents = helper.log().args.filter(function(evt) {
                    return evt[0].type == "exif";
                });
                logEvents.should.have.length(1);
                logEvents[0][0].should.have.a.property('msg');
                logEvents[0][0].msg.toString().should.startWith("Error: The given image is not a JPEG");
                done();
            },150);

            exifNode1.receive({payload:data});
        });
    });

    it('should report if bad payload', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        var data = "hello";
        var eD;
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            setTimeout(function() {
                var logEvents = helper.log().args.filter(function(evt) {
                    return evt[0].type == "exif";
                });
                logEvents.should.have.length(1);
                logEvents[0][0].should.have.a.property('msg');
                logEvents[0][0].msg.toString().should.startWith("Invalid payload received, ");
                done();
            },150);

            exifNode1.receive({payload:data});
        });
    });

    it('should report if no payload', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        var data = new Buffer("hello");
        var eD;
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            setTimeout(function() {
                var logEvents = helper.log().args.filter(function(evt) {
                    return evt[0].type == "exif";
                });
                logEvents.should.have.length(1);
                logEvents[0][0].should.have.a.property('msg');
                logEvents[0][0].msg.toString().should.startWith("No payload received, ");
                done();
            },150);

            exifNode1.receive({topic:data});
        });
    });

    it('should report if bad latitude', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        var data = new Buffer("hello");
        var eD;
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        var gpsmsg = { gps: { GPSLatitudeRef: 'N',
            GPSLatitude: [ 50, 57 ],
            GPSLongitudeRef: 'W',
            GPSLongitude: [ 1, 22, 1.2467 ],
            GPSAltitudeRef: 0,
            GPSAltitude: 50,
            GPSTimeStamp: [ 7, 32, 2 ] }
        };
        var spy = sinon.stub(exif, 'ExifImage',
            function(arg1,arg2){
                arg2(null,gpsmsg);
            });

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            setTimeout(function() {
                var logEvents = helper.log().args.filter(function(evt) {
                    return evt[0].type == "exif";
                });
                logEvents.should.have.length(1);
                logEvents[0][0].should.have.a.property('msg');
                logEvents[0][0].msg.toString().should.startWith("Invalid latitude data,");
                exif.ExifImage.restore();
                done();
            },150);

            exifNode1.receive({payload:data});
        });
    });

    it('should report if bad longitude', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        var data = new Buffer("hello");
        var eD;
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        var gpsmsg = { gps: { GPSLatitudeRef: 'N',
            GPSLatitude: [ 50, 57, 1.3 ],
            GPSLongitudeRef: 'W',
            GPSLongitude: [ 1, 22 ],
            GPSAltitudeRef: 0,
            GPSAltitude: 50,
            GPSTimeStamp: [ 7, 32, 2 ] }
        };
        var spy = sinon.stub(exif, 'ExifImage',
            function(arg1,arg2){
                arg2(null,gpsmsg);
            });

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            setTimeout(function() {
                var logEvents = helper.log().args.filter(function(evt) {
                    return evt[0].type == "exif";
                });
                logEvents.should.have.length(1);
                logEvents[0][0].should.have.a.property('msg');
                logEvents[0][0].msg.toString().should.startWith("Invalid longitude data,");
                exif.ExifImage.restore();
                done();
            },150);

            exifNode1.receive({payload:data});
        });
    });

    it('should report if unsure about location', function(done) {
        var exif = require('exif');
        var ExifImage = exif.ExifImage;
        var data = new Buffer("hello");
        var eD;
        var flow = [{id:"exifNode1", type:"exif", wires:[["helperNode1"]]},
                    {id:"helperNode1", type:"helper"}];

        var gpsmsg = { gps: { GPSLatitudeRef: 'N',
            GPSLatitude: [ 50, 57, 1.3 ],
            GPSAltitudeRef: 0,
            GPSAltitude: 50,
            GPSTimeStamp: [ 7, 32, 2 ] }
        };
        var spy = sinon.stub(exif, 'ExifImage',
            function(arg1,arg2){
                arg2(null,gpsmsg);
            });

        helper.load(exifNode, flow, function() {
            var exifNode1 = helper.getNode("exifNode1");
            var helperNode1 = helper.getNode("helperNode1");

            setTimeout(function() {
                var logEvents = helper.log().args.filter(function(evt) {
                    return evt[0].type == "exif";
                });
                logEvents.should.have.length(1);
                logEvents[0][0].should.have.a.property('msg');
                logEvents[0][0].msg.toString().should.startWith("The location of this image cannot be determined safely");
                exif.ExifImage.restore();
                done();
            },150);

            exifNode1.receive({payload:data});
        });
    });



});
