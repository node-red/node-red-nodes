"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweetStreamEventCombiner = void 0;
const events_1 = require("events");
const types_1 = require("../types");
class TweetStreamEventCombiner extends events_1.EventEmitter {
    constructor(stream) {
        super();
        this.stream = stream;
        this.stack = [];
        this.onStreamData = this.onStreamData.bind(this);
        this.onStreamError = this.onStreamError.bind(this);
        this.onceNewEvent = this.once.bind(this, 'event');
        // Init events from stream
        stream.on(types_1.ETwitterStreamEvent.Data, this.onStreamData);
        // Ignore reconnect errors: Don't close event combiner until connection error/closed
        stream.on(types_1.ETwitterStreamEvent.ConnectionError, this.onStreamError);
        stream.on(types_1.ETwitterStreamEvent.TweetParseError, this.onStreamError);
        stream.on(types_1.ETwitterStreamEvent.ConnectionClosed, this.onStreamError);
    }
    /** Returns a new `Promise` that will `resolve` on next event (`data` or any sort of error). */
    nextEvent() {
        return new Promise(this.onceNewEvent);
    }
    /** Returns `true` if there's something in the stack. */
    hasStack() {
        return this.stack.length > 0;
    }
    /** Returns stacked data events, and clean the stack. */
    popStack() {
        const stack = this.stack;
        this.stack = [];
        return stack;
    }
    /** Cleanup all the listeners attached on stream. */
    destroy() {
        this.removeAllListeners();
        this.stream.off(types_1.ETwitterStreamEvent.Data, this.onStreamData);
        this.stream.off(types_1.ETwitterStreamEvent.ConnectionError, this.onStreamError);
        this.stream.off(types_1.ETwitterStreamEvent.TweetParseError, this.onStreamError);
        this.stream.off(types_1.ETwitterStreamEvent.ConnectionClosed, this.onStreamError);
    }
    emitEvent(type, payload) {
        this.emit('event', { type, payload });
    }
    onStreamError(payload) {
        this.emitEvent('error', payload);
    }
    onStreamData(payload) {
        this.stack.push(payload);
        this.emitEvent('data', payload);
    }
}
exports.TweetStreamEventCombiner = TweetStreamEventCombiner;
exports.default = TweetStreamEventCombiner;
