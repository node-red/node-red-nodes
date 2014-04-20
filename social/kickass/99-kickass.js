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
var Kickass = require('node-kickass');


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
        msg.payload = [];
        this.kickass.setQuery(query).run(function (errors, data) {
            if (!errors.length > 0) {

                data.forEach(function (torrent) {
                    var parsedTorrent = {};
                    parsedTorrent.title = torrent.title;
                    parsedTorrent.description = torrent.description;
                    parsedTorrent.date = torrent.date;
                    parsedTorrent.link = torrent.link;
                    parsedTorrent.categories = torrent.categories;
                    parsedTorrent.torrentFileInfo = torrent.enclosures[0];
                    parsedTorrent.torrentMagnet = torrent["torrent:magneturi"]["#"];
                    msg.payload.push(parsedTorrent);
                });
                node.send(msg);
            } else {
                node.send(msg);
            }
        });
    });
}

RED.nodes.registerType("kickass", KickassNode);
