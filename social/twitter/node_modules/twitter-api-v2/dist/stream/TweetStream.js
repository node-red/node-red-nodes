"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweetStream = void 0;
const events_1 = require("events");
const request_handler_helper_1 = __importDefault(require("../client-mixins/request-handler.helper"));
const types_1 = require("../types");
const TweetStreamEventCombiner_1 = __importDefault(require("./TweetStreamEventCombiner"));
const TweetStreamParser_1 = __importStar(require("./TweetStreamParser"));
// In seconds
const basicRetriesAttempt = [5, 15, 30, 60, 90, 120, 180, 300, 600, 900];
// Default retry function
const basicReconnectRetry = tryOccurence => tryOccurence > basicRetriesAttempt.length
    ? 901000
    : basicRetriesAttempt[tryOccurence - 1] * 1000;
class TweetStream extends events_1.EventEmitter {
    constructor(requestData, connection) {
        super();
        this.requestData = requestData;
        this.autoReconnect = false;
        this.autoReconnectRetries = 5;
        // 2 minutes without any Twitter signal
        this.keepAliveTimeoutMs = 1000 * 120;
        this.nextRetryTimeout = basicReconnectRetry;
        this.parser = new TweetStreamParser_1.default();
        this.connectionProcessRunning = false;
        this.onKeepAliveTimeout = this.onKeepAliveTimeout.bind(this);
        this.initEventsFromParser();
        if (connection) {
            this.req = connection.req;
            this.res = connection.res;
            this.originalResponse = connection.originalResponse;
            this.initEventsFromRequest();
        }
    }
    on(event, handler) {
        return super.on(event, handler);
    }
    initEventsFromRequest() {
        if (!this.req || !this.res) {
            throw new Error('TweetStream error: You cannot init TweetStream without a request and response object.');
        }
        const errorHandler = (err) => {
            this.emit(types_1.ETwitterStreamEvent.ConnectionError, err);
            this.emit(types_1.ETwitterStreamEvent.Error, {
                type: types_1.ETwitterStreamEvent.ConnectionError,
                error: err,
                message: 'Connection lost or closed by Twitter.',
            });
            this.onConnectionError();
        };
        this.req.on('error', errorHandler);
        this.res.on('error', errorHandler);
        // Usually, connection should not be closed by Twitter!
        this.res.on('close', () => errorHandler(new Error('Connection closed by Twitter.')));
        this.res.on('data', (chunk) => {
            this.resetKeepAliveTimeout();
            if (chunk.toString() === '\r\n') {
                return this.emit(types_1.ETwitterStreamEvent.DataKeepAlive);
            }
            this.parser.push(chunk.toString());
        });
        // Starts the keep alive timeout
        this.resetKeepAliveTimeout();
    }
    initEventsFromParser() {
        const payloadIsError = this.requestData.payloadIsError;
        this.parser.on(TweetStreamParser_1.EStreamParserEvent.ParsedData, (eventData) => {
            if (payloadIsError && payloadIsError(eventData)) {
                this.emit(types_1.ETwitterStreamEvent.DataError, eventData);
                this.emit(types_1.ETwitterStreamEvent.Error, {
                    type: types_1.ETwitterStreamEvent.DataError,
                    error: eventData,
                    message: 'Twitter sent a payload that is detected as an error payload.',
                });
            }
            else {
                this.emit(types_1.ETwitterStreamEvent.Data, eventData);
            }
        });
        this.parser.on(TweetStreamParser_1.EStreamParserEvent.ParseError, (error) => {
            this.emit(types_1.ETwitterStreamEvent.TweetParseError, error);
            this.emit(types_1.ETwitterStreamEvent.Error, {
                type: types_1.ETwitterStreamEvent.TweetParseError,
                error,
                message: 'Failed to parse stream data.',
            });
        });
    }
    resetKeepAliveTimeout() {
        this.unbindKeepAliveTimeout();
        if (this.keepAliveTimeoutMs !== Infinity) {
            this.keepAliveTimeout = setTimeout(this.onKeepAliveTimeout, this.keepAliveTimeoutMs);
        }
    }
    onKeepAliveTimeout() {
        this.emit(types_1.ETwitterStreamEvent.ConnectionLost);
        this.onConnectionError();
    }
    unbindTimeouts() {
        this.unbindRetryTimeout();
        this.unbindKeepAliveTimeout();
    }
    unbindKeepAliveTimeout() {
        if (this.keepAliveTimeout) {
            clearTimeout(this.keepAliveTimeout);
            this.keepAliveTimeout = undefined;
        }
    }
    unbindRetryTimeout() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = undefined;
        }
    }
    closeWithoutEmit() {
        this.unbindTimeouts();
        if (this.res) {
            this.res.removeAllListeners();
            // Close response silentely
            this.res.destroy();
        }
        if (this.req) {
            this.req.removeAllListeners();
            // Close connection silentely
            this.req.destroy();
        }
    }
    /** Terminate connection to Twitter. */
    close() {
        this.emit(types_1.ETwitterStreamEvent.ConnectionClosed);
        this.closeWithoutEmit();
    }
    /** Unbind all listeners, and close connection. */
    destroy() {
        this.removeAllListeners();
        this.close();
    }
    /**
     * Make a new request that creates a new `TweetStream` instance with
     * the same parameters, and bind current listeners to new stream.
     */
    async clone() {
        const newRequest = new request_handler_helper_1.default(this.requestData);
        const newStream = await newRequest.makeRequestAsStream();
        // Clone attached listeners
        const listenerNames = this.eventNames();
        for (const listener of listenerNames) {
            const callbacks = this.listeners(listener);
            for (const callback of callbacks) {
                newStream.on(listener, callback);
            }
        }
        return newStream;
    }
    /** Start initial stream connection, setup options on current instance and returns itself. */
    async connect(options = {}) {
        if (typeof options.autoReconnect !== 'undefined') {
            this.autoReconnect = options.autoReconnect;
        }
        if (typeof options.autoReconnectRetries !== 'undefined') {
            this.autoReconnectRetries = options.autoReconnectRetries === 'unlimited'
                ? Infinity
                : options.autoReconnectRetries;
        }
        if (typeof options.keepAliveTimeout !== 'undefined') {
            this.keepAliveTimeoutMs = options.keepAliveTimeout === 'disable'
                ? Infinity
                : options.keepAliveTimeout;
        }
        if (typeof options.nextRetryTimeout !== 'undefined') {
            this.nextRetryTimeout = options.nextRetryTimeout;
        }
        // Make the connection
        this.unbindTimeouts();
        try {
            await this.reconnect();
        }
        catch (e) {
            this.emit(types_1.ETwitterStreamEvent.ConnectError, 0);
            this.emit(types_1.ETwitterStreamEvent.Error, {
                type: types_1.ETwitterStreamEvent.ConnectError,
                error: e,
                message: 'Connect error - Initial connection just failed.',
            });
            // Only make a reconnection attempt if autoReconnect is true!
            // Otherwise, let error be propagated
            if (this.autoReconnect) {
                this.makeAutoReconnectRetry(0, e);
            }
            else {
                throw e;
            }
        }
        return this;
    }
    /** Make a new request to (re)connect to Twitter. */
    async reconnect() {
        if (this.connectionProcessRunning) {
            throw new Error('Connection process is already running.');
        }
        this.connectionProcessRunning = true;
        try {
            let initialConnection = true;
            if (this.req) {
                initialConnection = false;
                this.closeWithoutEmit();
            }
            const { req, res, originalResponse } = await new request_handler_helper_1.default(this.requestData).makeRequestAndResolveWhenReady();
            this.req = req;
            this.res = res;
            this.originalResponse = originalResponse;
            this.emit(initialConnection ? types_1.ETwitterStreamEvent.Connected : types_1.ETwitterStreamEvent.Reconnected);
            this.parser.reset();
            this.initEventsFromRequest();
        }
        finally {
            this.connectionProcessRunning = false;
        }
    }
    async onConnectionError(retryOccurence = 0) {
        this.unbindTimeouts();
        // Close the request if necessary
        this.closeWithoutEmit();
        // Terminate stream by events if necessary (no auto-reconnect or retries exceeded)
        if (!this.autoReconnect) {
            this.emit(types_1.ETwitterStreamEvent.ConnectionClosed);
            return;
        }
        if (retryOccurence >= this.autoReconnectRetries) {
            this.emit(types_1.ETwitterStreamEvent.ReconnectLimitExceeded);
            this.emit(types_1.ETwitterStreamEvent.ConnectionClosed);
            return;
        }
        // If all other conditions fails, do a reconnect attempt
        try {
            this.emit(types_1.ETwitterStreamEvent.ReconnectAttempt, retryOccurence);
            await this.reconnect();
        }
        catch (e) {
            this.emit(types_1.ETwitterStreamEvent.ReconnectError, retryOccurence);
            this.emit(types_1.ETwitterStreamEvent.Error, {
                type: types_1.ETwitterStreamEvent.ReconnectError,
                error: e,
                message: `Reconnect error - ${retryOccurence + 1} attempts made yet.`,
            });
            this.makeAutoReconnectRetry(retryOccurence, e);
        }
    }
    makeAutoReconnectRetry(retryOccurence, error) {
        const nextRetry = this.nextRetryTimeout(retryOccurence + 1, error);
        this.retryTimeout = setTimeout(() => {
            this.onConnectionError(retryOccurence + 1);
        }, nextRetry);
    }
    async *[Symbol.asyncIterator]() {
        const eventCombiner = new TweetStreamEventCombiner_1.default(this);
        try {
            while (true) {
                if (!this.req || this.req.aborted) {
                    throw new Error('Connection closed');
                }
                if (eventCombiner.hasStack()) {
                    yield* eventCombiner.popStack();
                }
                const { type, payload } = await eventCombiner.nextEvent();
                if (type === 'error') {
                    throw payload;
                }
            }
        }
        finally {
            eventCombiner.destroy();
        }
    }
}
exports.TweetStream = TweetStream;
exports.default = TweetStream;
