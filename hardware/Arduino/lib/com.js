"use strict";

const Emitter = require("events");

class TransportStub extends Emitter {
  constructor(path /*, options, openCallback*/) {
    super();
    this.isOpen = true;
    this.baudRate = 0;
    this.path = path;
  }

  write(buffer) {
    // Tests are written to work with arrays not buffers
    // this shouldn't impact the data, just the container
    // This also should be changed in future test rewrites
    /* istanbul ignore else */
    if (Buffer.isBuffer(buffer)) {
      buffer = Array.from(buffer);
    }

    this.lastWrite = buffer;
    this.emit("write", buffer);
  }

  static list() {
    /* istanbul ignore next */
    return Promise.resolve([]);
  }
}

// This trash is necessary for stubbing with sinon.
TransportStub.SerialPort = TransportStub;

let com;
let error;
let SerialPort;

try {
  /* istanbul ignore else */
  if (process.env.IS_TEST_MODE) {
    com = TransportStub;
  } else {
    SerialPort = require("serialport").SerialPort;
    com = SerialPort;
  }
} catch (err) {
  /* istanbul ignore next */
  error = err;
}

/* istanbul ignore if */
if (com == null) {
  if (process.env.IS_TEST_MODE) {
    com = TransportStub;
  } else {
    console.log("It looks like serialport didn't install properly.");
    console.log(
      "More information can be found here https://serialport.io/docs/guide-installation"
    );
    console.log(`The result of requiring the package is: ${SerialPort}`);
    console.log(error);
    throw "Missing serialport dependency";
  }
}

module.exports = com;
