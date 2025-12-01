/* eslint-env node */
const net = require('net');
const _pi_gpio_command = require('./utils.js')._pi_gpio_command;
const _socklock = require('./utils.js')._socklock;
const def = require('./definitions.js');
const reverse_string = require('./utils.js').reverse_string;
const reverse_string_and_clean = require('./utils.js').reverse_string_and_clean;


const TIMEOUT = 2;

//notification flags
const NTFY_FLAGS_EVENT = (1 << 7);
//const NTFY_FLAGS_ALIVE = (1 << 6);
const NTFY_FLAGS_WDOG  = (1 << 5);
const NTFY_FLAGS_GPIO  = 31;

/**
 * An ADT class to hold event callback information.
 *
 * @param {number} event - The event id.
 * @param {callback} func - A user function taking one argument, the event id.
 * @private
 * @class
 */
/*
NOT USED YET
class  _event_ADT {
    constructor(event, func) {
        "use strict";
        this.event = event;
        this.func = func;
        this.bit = 1 << event;
    }
}*/

/**
 * An ADT class to hold callback information.
 *
 * @param {number} gpio - Broadcom GPIO number.
 * @param {number} edge - Either  EITHER_EDGE, RISING_EDGE or FALLING_EDGE.
 * @param {callback} func - A user function taking three arguments (GPIO, level, tick).
 * @private
 * @class
 */
class _callback_ADT {
    constructor (gpio, edge, func) {
        "use strict";
        this.gpio = gpio;
        this.edge = edge;
        this.func = func;
        this.bit = 1 << gpio;
    }
}

/**
 * A class to provide GPIO level change callbacks.
 */
class _callback {
    /**
     *
     * @param {Set} notify - Set of callbacks current registered.
     * @param {number} userGpio - Broadcom GPIO number.
     * @param {number} edge - Either  EITHER_EDGE, RISING_EDGE or FALLING_EDGE.
     * @param {callback} cb - A user function taking three arguments (GPIO, level, tick).
     */
    constructor(notify, userGpio, edge, cb) {
        "use strict";

        this._notify = notify;
        this.count = 0;
        this._reset = false;
        if (cb === undefined) {
            cb = this._tally;
        }
        this._callback = new _callback_ADT(userGpio, edge, cb);
        this._notify.append(this._callback);
    }

    /**
     * Cancels a callback by removing it from the notification thread.
     */
    cancel () {
        "use strict";
        this._notify.remove(this._callback);
    }

    /**
     * Increment the callback called count.
     *
     * @private
     */
    _tally () {
        "use strict";
        if (this._reset) {
            this._reset = false;
            this.count = 0;
        }
        this.count += 1;
    }

    /**
     *  Provides a count of how many times the default tally
     *  callback has triggered.
     *  The count will be zero if the user has supplied their own
     *  callback function.
     *
     */
    tally() {
        "use strict";
        return this.count;
    }

    reset_tally() {
        "use strict";
        this._reset = true;
        this.count = 0;
    }
}

module.exports._callback = _callback;

/**
 * A class to provide event callbacks.
 *
 * @param notify
 * @param event
 * @param cb
 * @private
 */
/*
NOT USED YET

class _event {
    constructor (notify, event, cb) {
        "use strict";
        this._notify = notify;
        this.count = 0;
        this._reset = false;
        if (cb === undefined) {
            cb = this._tally;
        }
        this.callback = new _event_ADT(event, cb);
        this._notify.append_event(this.callback);
    }

    /**
     * Cancels a event callback by removing it from the
     * notification thread.
     */
/*
    cancel (){
        "use strict";
        this._notify.remove_event(this.callback);
    }

    /**
     * Increment the event callback called count.
     *
     * @private
     */
/*
    _tally () {
        "use strict";
        if (this._reset) {
            this._reset = false;
            this.count = 0;
        }
        this.count += 1;
    }

    /**
     *  Provides a count of how many times the default tally
     *  callback has triggered.
     *
     *  The count will be zero if the user has supplied their own
     *  callback function.
     */
/*
    tally () {
        "use strict";
        return this.count;
    }

    reset_tally () {
        "use strict";
        this._reset = true;
        this.count = 0;
    }
}
*/

/**
 * Encapsulates waiting for GPIO edges.
 *
 * @param notify
 * @param gpio
 * @param edge
 * @param timeout
 * @private
 * @class
 */
/*
NOT NEEDED YET
class _wait_for_edge {
    constructor (notify, gpio, edge, timeout) {
        "use strict";
        this._notify = notify;
        this.callback = _callback_ADT(gpio, edge, this.func);
        this.trigger = false;
        this._notify.append(this.callback);
        const d = new Date();
        this.start = d.getTime();
        while (this.trigger === false && (d.getTime() - this.start) < timeout) {

        }
        this._notify.remove(this.callback);
    }
    func () {
        "use strict";
        this.trigger = true;
    }
}*/

/**
 * Encapsulates waiting for an event.
 *
 * @param notify
 * @param gpio
 * @param edge
 * @param timeout
 * @private
 */
/*
NOT NEEDED YET
class _wait_for_event {
    constructor (notify, event, timeout) {
        "use strict";
        this._notify = notify;
        this.callback = new _event_ADT(event, this.func);
        this.trigger = false;
        this._notify.append(this.callback);
        const d = new Date();
        this.start = d.getTime();
        while (this.trigger === false && (d.getTime() - this.start) < timeout) {
        }
        this._notify.remove(this.callback);
    }

    func () {
        "use strict";
        this.trigger = true;
    }
}*/

class _callback_thread {

    /**
     * Class to manage the notifications from remote gpio.
     *
     * @param {Object} control  - Socketlock for main socket.
     * @param {string} host - Remote Server name.
     * @param {number} port - Remote Server port.
     * @param {callback} cb - User function to be run after callback initialised.
     */
    constructor (control, host, port, cb) {
        "use strict";
        const that = this;
        this.control = control;
        this.callbacks = new Set();
        this.events = new Set();
        this.monitor = 0;
        this.sl = new _socklock(host, port);
        this.sl.s = net.connect({host, port});
        this.sl.s.on('connect', () => {
            _pi_gpio_command(that.sl, def.PI_CMD_NOIB, 0, 0, (err, data)=> {
                data = reverse_string_and_clean(data.toString('hex'));
                that.handle = data;
                cb();
            }, true);
        });

        this.sl.s.on("data", (data) => {
            const command =  parseInt(data.toString('hex').substr(0,2),16);

            if (that.sl._next[command] !== undefined) {
                if(command === 99 && that.sl._next[command] !== undefined) {
                    that.sl._next[command](undefined, data);
                    that.sl._next[command] = undefined;
                }
            } else {
                //const seq = reverse_string(data.toString('hex').substr(0,4));
                const flags = reverse_string(data.toString('hex').substr(4,4));
                const tick = reverse_string(data.toString('hex').substr(8,8));
                const level = reverse_string(data.toString('hex').substr(16,8));

                if (flags === 0) {
                    const changed = level ^ that.lastLevel;
                    that.lastLevel = level;
                    that.callbacks.forEach( (cb)=> {
                        if (cb.bit & changed) {
                            let newLevel = 0;
                            if (cb.bit & level) {
                                newLevel = 1;
                            }
                            if (cb.edge ^ newLevel) {
                                cb.func(cb.gpio, newLevel, tick);
                            }
                        }
                    });
                } else if (flags & NTFY_FLAGS_WDOG) {
                    const gpio = flags & NTFY_FLAGS_GPIO;
                    that.callbacks.forEach((cb) => {
                        if (cb.gpio === gpio) {
                            cb.func(gpio, TIMEOUT, tick);
                        }
                    });
                } else if (flags & NTFY_FLAGS_EVENT) {
                    const event = flags & NTFY_FLAGS_GPIO;
                    that.events.forEach((cb) => {
                        if (cb.event === event) {
                            cb.func(event, tick)
                        }
                    });
                }
            }
        });

        this.sl.s.on('error', (e) => {
            cb(e);
        });
        this.run();
    }
    stop () {
        const cmd = Buffer.alloc(16); // Crée un tampon de 16 octets
        cmd.writeUInt32LE(def.PI_CMD_NC, 0);
        cmd.writeUInt32LE(this.handle, 4);
        cmd.writeUInt32LE(0, 8);
        cmd.writeUInt32LE(0, 12);
        this.sl.s.write(cmd);
        this.sl.s.close();
    }

    /**
     * Adds a callback to the notification thread.
     *
     * @param {callback} callb - Function to be run.
     */
    append(callb) {
        this.callbacks.add(callb);
        this.monitor = this.monitor | callb.bit;
        _pi_gpio_command(this.control, def.PI_CMD_NB, this.handle, this.monitor);
    }

    /**
     * Removes a callback from the notification thread.
     *
     * @param {callback} callb - Function to be run.
     */
    remove(callb) {
        if (this.callbacks.has(callb)) {
            this.callbacks.delete(callb);
            let newMonitor = 0;
            this.callbacks.forEach( (cb) => {
                newMonitor |= cb.bit
            });
            if (newMonitor !== this.monitor) {
                this.monitor = newMonitor;
                _pi_gpio_command(this.control, def.PI_CMD_NB, this.handle, this.monitor);
            }
        }
    }

    /**
     * Adds an event callback to the notification thread.
     *
     * @param {callback} callb - Function to be run.
     */
    append_event(callb) {
        this.events.append(callb);
        this.event_bits = this.event_bits | callb.bit;
        _pi_gpio_command(this.control, def.PI_CMD_EVM, this.handle, this.event_bits);
    }

    /**
     * Removes an event callback from the notification thread.
     *
     * @param {callback} callb - Function to be run.
     */
    remove_event(callb) {
        if (this.events.has(callb)) {
            this.events.remove(callb);
            let new_event_bits = 0;
            this.events.forEach( (c) => {
                new_event_bits |= c.bit;
            });
            if (new_event_bits !== this.event_bits) {
                this.event_bits = new_event_bits;
                _pi_gpio_command(this.control, def.PI_CMD_EVM, this.handle, this.event_bits);
            }
        }
    }

    run() {
        const that = this;
        _pi_gpio_command(this.control,  def.PI_CMD_BR1, 0, 0, (err, data) => {
            if(data !== undefined) {
                that.lastLevel = data;
            }
        }, true);
    }

}

module.exports._callback_thread = _callback_thread;
