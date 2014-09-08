/**
 * Copyright 2013 Wolfgang Nagele
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

var RED = require(process.env.NODE_RED_HOME+"/red/red");
var util = require("util");
var aws = require("aws-sdk");
var attrWrapper = require("dynamodb-data-types").AttributeValue;

function DDBOutNode(n) {
    RED.nodes.createNode(this, n);
    this.credentials = RED.nodes.getNode(n.credentials);
    this.region = n.region || "us-east-1";
    this.table = n.table;

    aws.config.update({ accessKeyId: this.credentials.accessKey,
                        secretAccessKey: this.credentials.secretAccessKey,
                        region: this.region });

    var ddb = new aws.DynamoDB();

    this.on("input", function(msg) {
        ddb.putItem({ "TableName": this.table,
                      "Item": attrWrapper.wrap(msg.payload) },
            function(err, data) {
                if (err) { util.log(err); }
        });
    });
}
RED.nodes.registerType("ddb out", DDBOutNode);
