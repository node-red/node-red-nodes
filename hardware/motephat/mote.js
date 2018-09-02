
module.exports = function (RED) {
  "use strict";
  var fs = require('fs');
  var spawn = require('child_process').spawn;
  var execSync = require('child_process').execSync;

  var pythonScript = __dirname + "/mote.py";
  var allOK = true;

  try {
    var cpuinfo = fs.readFileSync("/proc/cpuinfo").toString();
    if (cpuinfo.indexOf(": BCM") === -1) {
      RED.log.warn("rpi-mote : " + RED._("node-red:rpi-gpio.errors.ignorenode"));
      allOK = false;
    }
    else if (!fs.existsSync("/usr/share/doc/python-rpi.gpio")) {
      RED.log.warn("rpi-mote : " + RED._("node-red:rpi-gpio.errors.libnotfound"));
      allOK = false;
    }
    else if (!fs.existsSync(pythonScript)) {
      RED.log.warn("rpi-mote : " + RED._("node-red:rpi-gpio.errors.libnotfound"));
      allOK = false;
    }
  }
  catch (err) {
    RED.log.warn("rpi-mote : " + RED._("node-red:rpi-gpio.errors.ignorenode"));
    allOK = false;
  }

  // the magic to make python print stuff immediately
  process.env.PYTHONUNBUFFERED = 1;

  function RpiMoteNode(n) {
    RED.nodes.createNode(this, n);
    this.brightness = n.brightness || 20;
    var node = this;

    function inputlistener(msg) {
      if (typeof msg.payload === "string") {
        msg.payload = msg.payload.replace('"', '');
        var s = msg.payload.toUpperCase().split(",");

        if (s.length === 1) {
          if ((s[0] == "CLS") || (s[0] == "CLR") || (s[0] == "CLEAR")) {
            //console.log("CLEAR")
            node.child.stdin.write("C\n");
          }
        }
        else if (s.length === 2) {
          if (s[0] === "BRIGHTNESS") {
            //console.log("BRIGHTNESS",s[1])
            node.child.stdin.write("B" + s[1] + "\n");
          }
          if ((s[0] == "CLR") || (s[0] == "CLEAR")) {
            //console.log("CLEAR CHANNEL",s[1])
            node.child.stdin.write("C" + s[1] + "\n");
          }
        }
        else if (s.length === 3) {
          //console.log("FILL",s)
          node.child.stdin.write('F' + msg.payload + '\n');
        }
        else if (s.length % 3 === 0 && s.length <= 48) {
          node.child.stdin.write('P*,' + msg.payload + '\n');
        }
        else if (s.length % 3 === 1 || s.length % 5 === 0 || s.length === 192) {
          //console.log("PIXELS",s)
          node.child.stdin.write('P' + msg.payload + '\n');
        }
        else if (s.length === 64) {
          //console.log("BUFFER",s)
          node.child.stdin.write(msg.payload);
          node.child.stdin.write("\n");
        }
        else { node.warn("Invalid input"); }
      }
      else { node.warn("Input not a string"); }
    }

    if (allOK === true) {
      //console.log('SPAWNING')
      node.child = spawn("python", ["-u", pythonScript, node.brightness]);
      node.status({ fill: "green", shape: "dot", text: "ok" });

      node.on("input", inputlistener);

      node.child.stdout.on('data', function (data) {
        if (RED.settings.verbose) { node.log("out: " + data + " :"); }
      });

      node.child.stderr.on('data', function (data) {
        if (RED.settings.verbose) { node.log("err: " + data + " :"); }
      });

      node.child.on('close', function (code, signal) {
        //console.log('CLOSING: '+ code + ' '+ signal)
        node.child = null;
        if (RED.settings.verbose) { node.log(RED._("rpi-gpio.status.closed")); }
        if (node.done) {
          node.status({ fill: "grey", shape: "ring", text: "closed" });
          node.done();
        }
        else { node.status({ fill: "red", shape: "ring", text: "stopped" }); }
      });

      node.child.on('error', function (err) {
        if (err.errno === "ENOENT") { node.error(RED._("rpi-gpio.errors.commandnotfound")); }
        else if (err.errno === "EACCES") { node.error(RED._("rpi-gpio.errors.commandnotexecutable")); }
        else { node.error(RED._("rpi-gpio.errors.error") + ': ' + err.errno); }
      });

      node.on("close", function (done) {
        node.status({ fill: "grey", shape: "ring", text: "closed" });
        //if (node.tout) { clearTimeout(node.tout); }
        if (node.child != null) {
          node.done = done;
          node.child.kill('SIGKILL');
        }
        else { done(); }
      });
      
    }
    else {
      node.status({ fill: "grey", shape: "dot", text: "node-red:rpi-gpio.status.not-available" });
    }
  }
  RED.nodes.registerType("rpi-mote", RpiMoteNode);
}