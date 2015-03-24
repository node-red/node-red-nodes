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

var path = require('path');

//console.log("WAS",process.env.NODE_RED_HOME);
//console.log("WAS2",__dirname);
process.env.NODE_RED_HOME = process.env.NODE_RED_HOME || path.resolve(__dirname+"/../../node-red");
//console.log("HOME",process.env.NODE_RED_HOME);
//console.log("PATH",path.join(process.env.NODE_RED_HOME, 'test', 'nodes', 'helper.js'));
var helper = require(path.join(process.env.NODE_RED_HOME, 'test', 'nodes', 'helper.js'));

try {
    helper.nock = helper.nock || require("nock");
} catch(er) {
    helper.nock = null;
}
module.exports = helper;
