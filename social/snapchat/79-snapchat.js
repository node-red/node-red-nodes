/**
 * Copyright 2013 Chris Mobberly
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

module.exports = function(RED) {
    "use strict";
    var snapchat = require('snapchat'),
    client = new snapchat.Client(),
    fs = require('fs');

    function SnapChatAccountNode(n) {
        RED.nodes.createNode(this,n);
        this.username = n.username;
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty("password"))) { this.password = credentials.password; }
        else { this.error("No password set"); }
    }

    function SnapChatNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        this.account = n.account;
        this.path = n.path;
        this.accountConfig = RED.nodes.getNode(this.account);

        this.username = this.accountConfig.username;
        this.password = this.accountConfig.password;

        this.on("input",function(){
            if (!fs.existsSync(this.path)) {
                fs.mkdirSync(this.path);
            }
            var path = this.path;
            var msg ={};
            msg.snaps =[];
            client.login(this.username, this.password).then(function(data) {
                msg.payload = data.snaps.length;
                data.snaps.forEach(function(snap) {
                    if (snap.st == 1 && typeof snap.t !== 'undefined') {
                        var full_path = path + snap.id + '.jpg';
                        var snapObject = {Sender:snap.sn,Path:full_path,SnapId:snap.id};
                        msg.snaps.push(snapObject);
                        var stream = fs.createWriteStream(full_path, { flags: 'w', encoding: null, mode: '0666' });
                        client.getBlob(snap.id).then(function(blob) {
                            blob.pipe(stream);
                            blob.resume();
                        });
                    }
                });
                client.clear();
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("Snap Chat",SnapChatNode);
    RED.nodes.registerType("snapchat-account",SnapChatAccountNode,{
        credentials: {
            password: {type: "password"}
        }
    });
}
