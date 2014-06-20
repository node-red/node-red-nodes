/**
 * Copyright 2013 IBM Corp.
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

// Require main module
//var RED = require(process.env.NODE_RED_HOME+"/red/red");
module.exports = function(RED) {

var PowerMate = require('node-powermate');
var pm;

// The main node definition - most things happen in here
function powerMateNode(n) {
    RED.nodes.createNode(this,n);
    this.name = n.name;
    this.topic = n.topic;
    
    var node = this;

    pm = new PowerMate();

    pm.on('buttonDown', function() {
       var msg = {};
       msg.topic = node.topic + '/button';
       msg.payload = 'down';
       node.send(msg);
    });

    pm.on('buttonUp', function() {
       var msg = {};
       msg.topic = node.topic + '/button';
       msg.payload = 'up';
       node.send(msg);
    });


   pm.on('wheelTurn', function(delta) {
       var msg = {};
       msg.topic = node.topic + '/wheel';
       msg.payload = delta;
       node.send(msg);
   });

   node.on('close', function(){
       try {
          node.log('shutting down powerMate');
       } catch(err) {
          node.error(err);
       }
   });
}

RED.nodes.registerType("powerMate",powerMateNode);
}
