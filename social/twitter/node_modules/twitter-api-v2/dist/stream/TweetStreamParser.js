"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EStreamParserEvent = void 0;
const events_1 = require("events");
class TweetStreamParser extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.currentMessage = '';
    }
    // Code partially belongs to twitter-stream-api for this
    // https://github.com/trygve-lie/twitter-stream-api/blob/master/lib/parser.js
    push(chunk) {
        this.currentMessage += chunk;
        chunk = this.currentMessage;
        const size = chunk.length;
        let start = 0;
        let offset = 0;
        while (offset < size) {
            // Take [offset, offset+1] inside a new string
            if (chunk.slice(offset, offset + 2) === '\r\n') {
                // If chunk contains \r\n after current offset,
                // parse [start, ..., offset] as a tweet
                const piece = chunk.slice(start, offset);
                start = offset += 2;
                // If empty object
                if (!piece.length) {
                    continue;
                }
                try {
                    const payload = JSON.parse(piece);
                    if (payload) {
                        this.emit(EStreamParserEvent.ParsedData, payload);
                        continue;
                    }
                }
                catch (error) {
                    this.emit(EStreamParserEvent.ParseError, error);
                }
            }
            offset++;
        }
        this.currentMessage = chunk.slice(start, size);
    }
    /** Reset the currently stored message (f.e. on connection reset) */
    reset() {
        this.currentMessage = '';
    }
}
exports.default = TweetStreamParser;
var EStreamParserEvent;
(function (EStreamParserEvent) {
    EStreamParserEvent["ParsedData"] = "parsed data";
    EStreamParserEvent["ParseError"] = "parse error";
})(EStreamParserEvent = exports.EStreamParserEvent || (exports.EStreamParserEvent = {}));
