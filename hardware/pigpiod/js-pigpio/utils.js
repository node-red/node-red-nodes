const assert = require('assert');

exports.reverse_string_and_clean = function (str) {
    var result='';
    var i = str.length-1;
    while (i>str.length-9) {
        result +=str [i-1] +  str[i] ;
        i -=2;
    }
    return parseInt(result,'16');
};

exports.reverse_string = function (str) {
    var result='';
    var i = str.length-1;
    while (i>0) {
            result +=str [i-1] +  str[i] ;
        i -=2;
    }
    return parseInt(result,'16');
};

const _LOCKS = [];

/**
 * A class to store socket and lock.
 * @private
 */
class _socklock {
    constructor(host, port) {
        this.s = null;
        this.host = host;
        this.port = port;
        this._next = [];
    }

    /* eslint: no-unmodified-loop-condition */
    _acquireLock() {
        "use strict";
        let timeout = false;
        setTimeout(() => {
            timeout = true
        }, 500);
        /* eslint-disable no-unmodified-loop-condition */
        while (!timeout && _LOCKS[this.host + ':' + this.port] !== undefined) {
            if (_LOCKS[this.host + ':' + this.port] === undefined) {
                _LOCKS[this.host + ':' + this.port] = 'Locked';
            } else {
                throw new Error('Can not acquire Lock');
            }
        }
        /* eslint-disable no-unmodified-loop-condition */
    }

    _releaseLock() {
        "use strict";
        if (_LOCKS[this.host + ':' + this.port] !== undefined) {
            _LOCKS[this.host + ':' + this.port] = undefined;
        }
    }
}

exports._socklock = _socklock;

exports._pi_gpio_command = function(socketlock, command, parameter1, parameter2, next, wait_for_response) {
    "use strict";
    assert(command !== undefined, "No command specified");
    // console.log("Receviced _pi_gpio_command "+command+" | "+parameter1+" | "+parameter2)
    const cmd = Buffer.alloc(16); // Crée un tampon de 16 octets
    cmd.writeUInt32LE(command, 0);
    cmd.writeUInt32LE(parameter1, 4);
    cmd.writeUInt32LE(parameter2, 8);
    cmd.writeUInt32LE(0, 12);

    socketlock._acquireLock();

    if (next !== undefined) {
        socketlock._next[command] = next;
    }

    if(!socketlock.s.write(cmd)) {
        next(new Error("Error Sending Command to Pi: "+command));
    }

    if(!wait_for_response) {
        socketlock._releaseLock();
    }

};
