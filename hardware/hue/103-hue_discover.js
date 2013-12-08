/**
 * philips_hue.js
 * Basic functionality for accessing a Philips Hue wireless Lamp
 * Allows for bridge/gateway detection and light scanning.
 * Requires node-hue-api https://github.com/peter-murray/node-hue-api
 * Copyright 2013 Charalampos Doukas - @BuildingIoT
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


//Require node-hue-api
var hue = require("node-hue-api");
var HueApi = require("node-hue-api").HueApi;

// Require main module
var RED = require(process.env.NODE_RED_HOME+"/red/red");

//store the IP address of the Hue Gateway
var gw_ipaddress = "";

var username;

// The main node definition - most things happen in here
function HueNodeDiscovery(n) {
    // Create a RED node
    RED.nodes.createNode(this,n);

    var node = this;

    //get username from user input
    this.username = n.username;
   

    // Store local copies of the node configuration (as defined in the .html)
    this.topic = n.topic;

    this.on("input", function(msg){
        
        //start with detecting the IP address of the Hue gateway in the local network:
        hue.locateBridges(function(err, result) {
            var msg = {};
            if (err) throw err;
            //check for found bridges
            if(result[0]!=null) {
                //save the IP address of the 1st bridge found
                this.gw_ipaddress = result[0].ipaddress;
                msg.payload = this.gw_ipaddress;

                //get light info:
                var api = new HueApi(this.gw_ipaddress, node.username);
                api.lights(function(err, lights) {
                    var msg2 = {};
                    if (err) throw err;
                    var lights_discovered = JSON.stringify(lights, null, 2);
                    msg2.topic = "Lights";
                    msg2.payload = lights_discovered;
                    node.send([msg, msg2]);

                });
            }
            else {
                //bridge not found:
                var msg = {};
                msg.payload = "Bridge not found!";
                node.send(msg);
            }

        });

    });


    this.on("close", function() {
        // Called when the node is shutdown - eg on redeploy.
        // Allows ports to be closed, connections dropped etc.
        // eg: this.client.disconnect();
    });

 }

 //hue debugging on the output:
 var displayResult = function(result) {
    console.log(result);
};

var displayError = function(err) {
    console.error(err);
};



// Register the node by name. This must be called before overriding any of the
// Node functions.
RED.nodes.registerType("Discover",HueNodeDiscovery);