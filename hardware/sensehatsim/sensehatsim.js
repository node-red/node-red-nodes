
module.exports = function(RED) {
    "use strict";
    var path = require("path");
    var ws = require("ws");
    var colours = require('./colours');

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

    var currentFlipH = false;
    var currentFlipV = false;
    var currentRotation = "R0";
    var currentDisplay = [];
    var HAT = (function() {
        var hatWS = null;
        var wsServerListeners = {};
        var wsConnections = {};
        var currentEnvironment = {temperature: 20, humidity: 80, pressure: 1000};
        var hat = null;
        var onclose = null;
        var users = [];
        var motionUsers = 0;
        var envUsers = 0;
        var reconnectTimer = null;
        var envTimer = null;

        var connect = function() {
            if (!hatWS) {
                currentFlipH = false;
                currentFlipV = false;
                currentRotation = "R0";
                currentDisplay = [];
                for (var y=0; y<8; y++) {
                    currentDisplay.push([]);
                    for (var x=0; x<8; x++) {
                        currentDisplay[y].push('0,0,0');
                    }
                }
                var wsPath = RED.settings.httpNodeRoot || "/";
                wsPath = wsPath + (wsPath.slice(-1) == "/" ? "":"/") + "sensehat-simulator/ws"

                var storeListener = function(event,listener) {
                    if (event == "error" || event == "upgrade" || event == "listening") {
                        wsServerListeners[event] = listener;
                    }
                }
                RED.server.addListener('newListener',storeListener);
                // Create a WebSocket Server
                hatWS = new ws.Server({
                    server:RED.server,
                    path:wsPath,
                    // Disable the deflate option due to this issue
                    //  https://github.com/websockets/ws/pull/632
                    // that is fixed in the 1.x release of the ws module
                    // that we cannot currently pickup as it drops node 0.10 support
                    perMessageDeflate: false
                });
                RED.server.removeListener('newListener',storeListener);
                hatWS.on('connection', function(socket) {
                    var id = (1+Math.random()*4294967295).toString(16);
                    wsConnections[id] = socket;
                    socket.send("Y"+currentEnvironment.temperature+","+currentEnvironment.humidity+","+currentEnvironment.pressure);
                    socket.send(currentRotation);
                    if (currentFlipV) {
                        socket.send("FV");
                    }
                    if (currentFlipH) {
                        socket.send("FH");
                    }
                    var cmd = "";
                    for (var y=0; y<8; y++) {
                        for (var x=0; x<8; x++) {
                            cmd += ","+x+","+y+","+currentDisplay[y][x];
                        }
                    }
                    socket.send("P"+cmd.substring(1));


                    socket.on('close',function() {
                        delete wsConnections[id];
                    });
                    socket.on('message',function(data,flags) {
                        var m;
                        var msg;
                        if ((m = LF_RE.exec(data)) !== null) {
                            currentEnvironment = {temperature: Number(m[1]), humidity: Number(m[2]), pressure: Number(m[3])};
                            msg = "Y"+currentEnvironment.temperature+","+currentEnvironment.humidity+","+currentEnvironment.pressure;
                            for (var id in wsConnections) {
                                if (wsConnections.hasOwnProperty(id)) {
                                    var client = wsConnections[id];
                                    if (client !== socket) {
                                        client.send(msg);
                                    }
                                }
                            }
                        } else if ((m = KEY_RE.exec(data)) !== null) {
                            msg = {
                                topic: "joystick",
                                payload: {key: KEY_MAP[m[1]], state: Number(m[2])}
                            }
                            for (var j=0; j<users.length; j++) {
                                var node = users[j];
                                if (node.stick) {
                                    node.send(RED.util.cloneMessage(msg));
                                }
                            }
                        }

                    });
                    socket.on('error', function(err) {
                        delete wsConnections[id];
                    });
                });
            }
        }

        var disconnect = function(done) {
            if (hatWS !== null) {
                var listener = null;
                for (var event in wsServerListeners) {
                    if (wsServerListeners.hasOwnProperty(event)) {
                        listener = wsServerListeners[event];
                        if (typeof listener === "function") {
                            RED.server.removeListener(event,listener);
                        }
                    }
                }
                wsServerListeners = {};
                wsConnections = {};
                hatWS.close();
                hatWS = null;
            }
            done();
        }


        return {
            open: function(node) {
                if (!hatWS) {
                    connect();
                }
                if (!reconnectTimer) {
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                }

                if (node.motion) {
                    motionUsers++;
                }
                if (node.env) {
                    envUsers++;
                }
                users.push(node);
                if (envUsers === 1) {
                    envTimer = setInterval(function() {
                        var msg = {
                            topic: "environment",
                            payload: {temperature: currentEnvironment.temperature, humidity: currentEnvironment.humidity, pressure: currentEnvironment.pressure}
                        };
                        for (var j=0; j<users.length; j++) {
                            var node = users[j];
                            if (node.env) {
                                node.send(RED.util.cloneMessage(msg));
                            }
                        }
                    },1000);
                }


            },
            close: function(node,done) {
                if (node.motion) {
                    motionUsers--;
                }
                if (node.env) {
                    envUsers--;
                }
                if (envUsers === 0) {
                    clearTimeout(envTimer);
                }
                users.splice(users.indexOf(node),1);
                if (users.length === 0) {
                    disconnect(done);
                } else {
                    done();
                }
            },
            send: function(msg) {
                for (var id in wsConnections) {
                    if (wsConnections.hasOwnProperty(id)) {
                        var client = wsConnections[id];
                        client.send(msg);
                    }
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
        node.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
        HAT.open(this);

        node.on("close", function(done) {
            HAT.close(this,done);
        });
    }
    RED.nodes.registerType("rpi-sensehatsim in",SenseHatInNode);

    function SenseHatOutNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});

        HAT.open(this);

        node.on("close", function(done) {
            HAT.close(this,done);
        });
        var handleTextMessage = function(line,msg) {
            var textCol = colours.getRGB(msg.color||msg.colour)||"255,255,255";
            var backCol = colours.getRGB(msg.background)||"0,0,0";
            var speed = null;
            if (!isNaN(msg.speed)) {
                speed = msg.speed;
            }
            var command = "T";
            if (textCol) {
                command += textCol;
                if (backCol) {
                    command += ","+backCol;
                }
            }

            if (speed) {
                var s = parseInt(speed);
                if (s >= 1 && s <= 5) {
                    s = 0.1 + (3-s)*0.03;
                }
                command = command + ((command.length === 1)?"":",") + s;
            }
            command += ":" + line;
            return command;
        }

        node.on("input",function(msg) {
            var command;
            var parts;
            var col;
            if (typeof msg.payload === 'number') {
                HAT.send(handleTextMessage(""+msg.payload,msg));
            } else if (typeof msg.payload === 'string') {
                var lines = msg.payload.split("\n");
                lines.forEach(function(line) {
                    command = null;
                    if ( /^(([0-7]|\*|[0-7]-[0-7]),([0-7]|\*|[0-7]-[0-7]),(\d{1,3},\d{1,3},\d{1,3}|#[a-f0-9]{3,6}|[a-z]+))(,([0-7]|\*|[0-7]-[0-7]),([0-7]|\*|[0-7]-[0-7]),(\d{1,3},\d{1,3},\d{1,3}|#[a-f0-9]{3,6}|[a-z]+))*$/i.test(line)) {
                        parts = line.split(",");
                        var expanded = [];
                        var i=0;
                        var j=0;
                        while (i<parts.length) {
                            var x = parts[i++];
                            var y = parts[i++];
                            col = parts[i++];
                            if (/#[a-f0-9]{3,6}|[a-z]/i.test(col)) {
                                col = colours.getRGB(col);
                                if (col === null) {
                                    // invalid colour, go no further
                                    return;
                                }
                            } else {
                                col += ","+parts[i++]+","+parts[i++];
                            }
                            if (x === '*') {
                                x = "0-7";
                            }
                            if (y === '*') {
                                y = "0-7";
                            }
                            var x0,x1;
                            var y0,y1;
                            if (x.indexOf("-") === -1) {
                                x0 = x1 = parseInt(x);
                            } else {
                                var px = x.split("-");
                                x0 = parseInt(px[0]);
                                x1 = parseInt(px[1]);
                                if (x1<x0) {
                                    j = x1;
                                    x1 = x0;
                                    x0 = j;
                                }
                            }
                            if (y.indexOf("-") === -1) {
                                y0 = y1 = parseInt(y);
                            } else {
                                var py = y.split("-");
                                y0 = parseInt(py[0]);
                                y1 = parseInt(py[1]);
                                if (y1<y0) {
                                    j = y1;
                                    y1 = y0;
                                    y0 = j;
                                }
                            }
                            x = x0;
                            while (x<=x1) {
                                y = y0;
                                while (y<=y1) {
                                    expanded.push([x,y,col]);
                                    y++;
                                }
                                x++;
                            }
                        }
                        if (expanded.length > 0) {
                            var pixels = {};
                            var rules = [];
                            for (i=expanded.length-1; i>=0; i--) {
                                var rule = expanded[i];
                                if (!pixels[rule[0]+","+rule[1]]) {
                                    rules.unshift(rule.join(","));
                                    currentDisplay[Number(rule[1])][Number(rule[0])] = rule[2];
                                    pixels[rule[0]+","+rule[1]] = true;
                                }
                            }
                            if (rules.length > 0) {
                                command = "P"+rules.join(",");
                            }
                        }
                    }


                    if (!command) {
                        if (/^R(0|90|180|270)$/i.test(line)) {
                            command = line.toUpperCase();
                            currentRotation = command;
                        } else if (/^F(H|V)$/i.test(line)) {
                            command = line.toUpperCase();
                            if (command === 'FH') {
                                currentFlipH = !currentFlipH;
                            } else {
                                currentFlipV = !currentFlipV;
                            }
                        } else if (/^D(0|1)$/i.test(line)) {
                            command = line.toUpperCase();
                        } else {
                            command = handleTextMessage(line,msg);
                        }
                    }
                    if (command) {
                        //console.log(command);
                        HAT.send(command);
                    }
                });
            }
        });
    }
    RED.nodes.registerType("rpi-sensehatsim out",SenseHatOutNode);

    RED.httpAdmin.get("/sensehat-simulator", RED.auth.needsPermission('sensehat-simulator.read'), function(req,res) {
        res.sendFile(path.join(__dirname,"public","index.html"));
    });
}
