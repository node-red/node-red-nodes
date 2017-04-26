/**
 * Copyright 2013 Juan Pablo Kutianski.
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

var cheerio = require('cheerio');
var util = require('util');

function CherrioNode(n) {
    RED.nodes.createNode(this, n);

    this.name = n.name;
    this.selector = n.selector;
    this.output = n.output;

    this.on("input", function(msg) {
        if (msg !== null) {
            try {
                $ = cheerio.load(msg.payload);

                var selector = (n.selector)?n.selector:"a";
                var selJSON =  JSON.stringify($(selector).toArray(), function (key, val) {
                        if (key === "prev" || key === "next" || key === "parent") return undefined;
                        return val;
                    });

                switch (n.output) {
                  case "xml":
                    msg.payload = $.xml(selector);
                    break;
                  case "html":
                    msg.payload = $.html(selector);
                    break;
                  case "json":
                    msg.payload = selJSON;
                    break;
                  case "array":
                    msg.payload = JSON.parse(selJSON);
                    break;
                };
                this.send(msg);
            } catch (err) {
                this.error(err.message);
            }
        }
    });
}

RED.nodes.registerType("selector", CherrioNode);