/**
 * Copyright 2016 IBM Corp.
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
    var fs = require('fs');
    var spawn = require('child_process').spawn;

    var hatCommand = __dirname+'/sensehat';

    if ( !(1 & parseInt ((fs.statSync(hatCommand).mode & parseInt ("777", 8)).toString (8)[0]) )) {
        RED.log.error(hatCommand + " command is not executable");
        throw "Error : "+RED._("rpi-gpio.errors.mustbeexecutable");
    }

    // the magic to make python print stuff immediately
    process.env.PYTHONUNBUFFERED = 1;

    // Xaccel.x,y,z,gyro.x,y,z,orientation.roll,pitch,yaw,compass
    var HF_RE = /^X(.+),(.+),(.+),(.+),(.+),(.+),(.+),(.+),(.+),(.+)$/;
    //  Ytemperature,humidity,pressure
    var LF_RE = /^Y(.+),(.+),(.+)$/;
    //  K[U|L|R|D|E][0|1|2] - joystick event:  direction,state
    var KEY_RE = /^K(.)(.)$/;
    var KEY_MAP = {
        "U":"UP",
        "D":"DOWN",
        "L":"LEFT",
        "R":"RIGHT",
        "E":"ENTER"
    };

    var HAT = (function() {
        var hat = null;
        var onclose = null;
        var users = [];
        var motionUsers = 0;
        var envUsers = 0;
        var reconnectTimer = null;

        var connect = function() {
            var buffer = "";
            hat = spawn(hatCommand);
            hat.stdout.on('data', function (data) {
                buffer += data.toString();
                var lines = buffer.split("\n");
                if (lines.length == 1) {
                    return;
                }
                buffer = lines.pop();
                var m,msg;
                for (var i=0;i<lines.length;i++) {
                    var line = lines[i];
                    msg = null;
                    if ((m = KEY_RE.exec(line)) !== null) {
                        msg = {
                            topic: "joystick",
                            payload: {key: KEY_MAP[m[1]], state: Number(m[2])}
                        }
                    } else if ((m = LF_RE.exec(line)) !== null) {
                        msg = {
                            topic: "environment",
                            payload: {temperature: Number(m[1]), humidity: Number(m[2]), pressure: Number(m[3])}
                        }
                    } else if ((m = HF_RE.exec(line)) !== null) {
                        // Xaccel.x,y,z,gyro.x,y,z,orientation.roll,pitch,yaw,compass
                        msg = {
                            topic: "motion",
                            payload: {
                                acceleration: {
                                    x: Number(m[1]),
                                    y: Number(m[2]),
                                    z: Number(m[3])
                                },
                                gyroscope: {
                                    x: Number(m[4]),
                                    y: Number(m[5]),
                                    z: Number(m[6])
                                },
                                orientation: {
                                    roll: Number(m[7]),
                                    pitch: Number(m[8]),
                                    yaw: Number(m[9])
                                },
                                compass: Number(m[10])
                            }
                        }
                    }
                    if (msg && !onclose) {
                        for (var j=0;j<users.length;j++) {
                            var node = users[j];
                            if (node.motion && msg.topic === "motion") {
                                node.send(msg);
                            } else if (node.env && msg.topic === 'environment') {
                                node.send(msg);
                            } else if (node.stick && msg.topic === 'joystick') {
                                node.send(msg);
                            }
                        }
                    }
                }
            });

            hat.stderr.on('data', function (data) {
                if (RED.settings.verbose) { RED.log.error("err: "+data+" :"); }
            });

            hat.on('close', function (code) {
                hat = null;
                if (RED.settings.verbose) { RED.log.info(RED._("rpi-gpio.status.closed")); }
                if (onclose) {
                    onclose();
                    onclose = null;
                } else {
                    reconnectTimer = setTimeout(function() {
                        connect();
                    },5000);
                }
            });

            hat.on('error', function (err) {
                if (err.errno === "ENOENT") { RED.log.error(RED._("rpi-gpio.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { RED.log.error(RED._("rpi-gpio.errors.commandnotexecutable")); }
                else { RED.log.error(RED._("rpi-gpio.errors.error")+': ' + err.errno); }
            });

            if (motionUsers > 0) {
                hat.stdin.write('X1\n');
            }
            if (envUsers > 0) {
                hat.stdin.write('Y1\n');
            }

        }

        var disconnect = function(done) {
            if (hat !== null) {
                onclose = done;
                hat.kill('SIGKILL');
                hat = null;
            }
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }

        }


        return {
            open: function(node) {
                if (!hat) {
                    connect();
                }

                if (node.motion) {
                    if (motionUsers === 0) {
                        hat.stdin.write('X1\n');
                    }
                    motionUsers++;
                }
                if (node.env) {
                    if (envUsers === 0) {
                        hat.stdin.write('Y1\n');
                    }
                    envUsers++;
                }
                users.push(node);
            },
            close: function(node,done) {
                if (node.motion) {
                    motionUsers--;
                    if (motionUsers === 0) {
                        hat.stdin.write('X0\n');
                    }
                }
                if (node.env) {
                    envUsers--;
                    if (envUsers === 0) {
                        hat.stdin.write('Y0\n');
                    }
                }
                users.splice(users.indexOf(node),1);
                if (users.length === 0) {
                    disconnect(done);
                } else {
                    done();
                }
            }
        }
    })();

    function SenseHatInNode(n) {
        RED.nodes.createNode(this,n);
        this.motion = n.motion;
        this.env = n.env;
        this.stick = n.stick;
        var node = this;
        HAT.open(this);

        node.on("close", function(done) {
            HAT.close(this,done);
        });
    }
    RED.nodes.registerType("rpi-sensehat in",SenseHatInNode);
}
