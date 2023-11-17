
module.exports = function(RED) {
    "use strict";

    var Board = require('./lib/firmata');
    var SP = require('serialport');

    // The Board Definition - this opens (and closes) the connection
    function ArduinoNode(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device || null;
        this.running = false;
        this.reported = false;
        var node = this;

        var startup = function() {
            node.board = new Board(node.device, function(e) {
                if ((e !== undefined) && (e.toString().indexOf("cannot open") !== -1) ) {
                    if (node.reported === false) {
                        node.error(RED._("arduino.errors.portnotfound",{device:node.device}));
                        node.reported = true;
                    }
                }
                else if (e === undefined) {
                    node.running = true;
                    node.reported = false;
                    node.board.once('ready', function() {
                        node.log(RED._("arduino.status.connected",{device:node.board.sp.path}));
                        if (RED.settings.verbose) {
                            node.log(RED._("arduino.status.version",{version:node.board.firmware.name+"-"+node.board.version.major+"."+node.board.version.minor}));
                        }
                    });
                    node.board.once('close', function() {
                        node.error(RED._("arduino.status.portclosed"));
                    });
                    node.board.once('disconnect', function() {
                        if (node.running === true) { setTimeout(function() { node.running = false; startup(); }, 5000); }
                    });
                }
            });
            setTimeout(function() { if (node.running === false) { startup(); } }, 5000);
        };
        startup();

        node.on('close', function(done) {
            node.running = false;
            if (node.board) {
                try {
                    node.board.transport.close(function() {
                        if (RED.settings.verbose) { node.log(RED._("arduino.status.portclosed")); }
                        done();
                    });
                }
                catch(e) { done(); }
            }
            else { done(); }
        });
    }
    RED.nodes.registerType("arduino-board",ArduinoNode);


    // The Input Node
    function DuinoNodeIn(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = n.pin;
        this.state = n.state;
        this.arduino = n.arduino;
        this.serverConfig = RED.nodes.getNode(this.arduino);
        this.running = false;
        var node = this;
        if (typeof this.serverConfig === "object") {
            var startup = function() {
                node.board = node.serverConfig.board;
                node.board.setMaxListeners(0);
                node.oldval = "";
                node.status({fill:"grey",shape:"ring",text:"node-red:common.status.connecting"});
                var doit = function() {
                    node.running = true;
                    if (node.state === "ANALOG") { node.board.pinMode(node.pin, 0x02); }
                    if (node.state === "INPUT") { node.board.pinMode(node.pin, 0x00); }
                    if (node.state === "PULLUP") { node.board.pinMode(node.pin, 0x0B); }
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                    if (node.state === "ANALOG") {
                        node.board.analogRead(node.pin, function(v) {
                            if (v !== node.oldval) {
                                node.oldval = v;
                                node.send({payload:v, topic:"A"+node.pin});
                            }
                        });
                    }
                    if (node.state === "INPUT") {
                        node.board.digitalRead(node.pin, function(v) {
                            if (v !== node.oldval) {
                                node.oldval = v;
                                node.send({payload:v, topic:node.pin});
                            }
                        });
                    }
                    if (node.state === "PULLUP") {
                        node.board.digitalRead(node.pin, function(v) {
                            if (v !== node.oldval) {
                                node.oldval = v;
                                node.send({payload:v, topic:node.pin});
                            }
                        });
                    }
                    if (node.state == "STRING") {
                        node.board.on('string', function(v) {
                            if (v !== node.oldval) {
                                node.oldval = v;
                                node.send({payload:v, topic:"string"});
                            }
                        });
                    }
                    node.board.once('disconnect', function() {
                        node.status({fill:"red",shape:"ring",text:"node-red:common.status.not-connected"});
                        if (node.running) { setTimeout(function() { node.running = false; startup(); }, 5500); }
                    });
                }
                if (node.board.isReady) { doit(); }
                else { node.board.once("ready", function() { doit(); }); }
                setTimeout(function() { if (node.running === false) { startup(); } }, 4500);
            }
            startup();
        }
        else {
            node.warn(RED._("arduino.errors.portnotconf"));
        }
        node.on('close', function() {
            node.running = false;
        });
    }
    RED.nodes.registerType("arduino in",DuinoNodeIn);


    // The Output Node
    function DuinoNodeOut(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = n.pin;
        this.state = n.state;
        this.arduino = n.arduino;
        this.serverConfig = RED.nodes.getNode(this.arduino);
        this.running = false;
        var node = this;
        if (typeof node.serverConfig === "object") {
            var startup = function() {
                node.board = node.serverConfig.board;
                node.board.setMaxListeners(0);
                node.status({fill:"grey",shape:"ring",text:"node-red:common.status.connecting"});
                var doit = function() {
                    node.running = true;
                    if (node.state === "OUTPUT") { node.board.pinMode(node.pin, 0x01); }
                    if (node.state === "PWM") { node.board.pinMode(node.pin, 0x03); }
                    if (node.state === "SERVO") { node.board.pinMode(node.pin, 0x04); }
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                    node.on("input", function(msg) {
                        if (node.board.isReady) {
                            if (node.state === "OUTPUT") {
                                if ((msg.payload === true)||(msg.payload.toString() == "1")||(msg.payload.toString().toLowerCase() == "on")) {
                                    node.board.digitalWrite(node.pin, node.board.HIGH);
                                }
                                if ((msg.payload === false)||(msg.payload.toString() == "0")||(msg.payload.toString().toLowerCase() == "off")) {
                                    node.board.digitalWrite(node.pin, node.board.LOW);
                                }
                            }
                            if (node.state === "PWM") {
                                msg.payload = parseInt((msg.payload * 1) + 0.5);
                                if ((msg.payload >= 0) && (msg.payload <= 255)) {
                                    node.board.analogWrite(node.pin, msg.payload);
                                }
                            }
                            if (node.state === "SERVO") {
                                msg.payload = parseInt((msg.payload * 1) + 0.5);
                                if ((msg.payload >= 0) && (msg.payload <= 180)) {
                                    node.board.servoWrite(node.pin, msg.payload);
                                }
                            }
                            if (node.state === "SYSEX") {
                                node.board.sysexCommand(msg.payload);
                            }
                            if (node.state === "STRING") {
                                node.board.sendString(msg.payload.toString());
                            }
                        }
                    });
                    node.board.once('disconnect', function() {
                        node.status({fill:"red",shape:"ring",text:"node-red:common.status.not-connected"});
                        if (node.running === true) { setTimeout(function() { node.running = false; startup(); }, 5500); }
                    });
                }
                if (node.board.isReady) { doit(); }
                else { node.board.once("ready", function() { doit(); }); }
                setTimeout(function() { if (node.running === false) { startup(); } }, 4500);
            }
            startup();
        }
        else {
            node.warn(RED._("arduino.errors.portnotconf"));
        }
        node.on('close', function() {
            node.running = false;
        });
    }
    RED.nodes.registerType("arduino out",DuinoNodeOut);

    RED.httpAdmin.get("/arduinoports", RED.auth.needsPermission("arduino.read"), function(req,res) {
        SP.list().then(
            ports => {
                const a = ports.map(p => p.comName);
                res.json(a);
            },
            err => {
                this.log('Error listing serial ports', err)
            }
        )
    });
}
