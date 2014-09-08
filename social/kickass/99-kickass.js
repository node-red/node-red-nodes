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
var RED = require(process.env.NODE_RED_HOME + "/red/red");
var Kickass = require('node-kickass-json');


function KickassNode(n) {
    RED.nodes.createNode(this, n);
    this.order = n.order;
    this.sort = n.sort;
    this.title = n.title;
    var node = this;
    this.kickass = new Kickass();
    this.kickass.setSort({
        field: this.sort,
        sorder: this.order
    });
    this.on("input", function (msg) {
        var query = msg.topic || this.title;
        msg.topic = query;
        this.kickass.setQuery(query).run(function (error, data) {
            if (error === null) {
                msg.payload = data;
                node.send(msg);
            } else {
                node.error(error);
            }
        });
    });
}

RED.nodes.registerType("kickass", KickassNode);
