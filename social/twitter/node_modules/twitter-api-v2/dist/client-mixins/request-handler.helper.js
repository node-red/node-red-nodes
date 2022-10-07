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
exports.RequestHandlerHelper = void 0;
const https_1 = require("https");
const settings_1 = require("../settings");
const TweetStream_1 = __importDefault(require("../stream/TweetStream"));
const types_1 = require("../types");
const zlib = __importStar(require("zlib"));
class RequestHandlerHelper {
    constructor(requestData) {
        this.requestData = requestData;
        this.requestErrorHandled = false;
        this.responseData = [];
    }
    /* Request helpers */
    get hrefPathname() {
        const url = this.requestData.url;
        return url.hostname + url.pathname;
    }
    isCompressionDisabled() {
        return !this.requestData.compression || this.requestData.compression === 'identity';
    }
    isFormEncodedEndpoint() {
        return this.requestData.url.href.startsWith('https://api.twitter.com/oauth/');
    }
    /* Error helpers */
    createRequestError(error) {
        if (settings_1.TwitterApiV2Settings.debug) {
            settings_1.TwitterApiV2Settings.logger.log('Request error:', error);
        }
        return new types_1.ApiRequestError('Request failed.', {
            request: this.req,
            error,
        });
    }
    createPartialResponseError(error, abortClose) {
        const res = this.res;
        let message = `Request failed with partial response with HTTP code ${res.statusCode}`;
        if (abortClose) {
            message += ' (connection abruptly closed)';
        }
        else {
            message += ' (parse error)';
        }
        return new types_1.ApiPartialResponseError(message, {
            request: this.req,
            response: this.res,
            responseError: error,
            rawContent: Buffer.concat(this.responseData).toString(),
        });
    }
    formatV1Errors(errors) {
        return errors
            .map(({ code, message }) => `${message} (Twitter code ${code})`)
            .join(', ');
    }
    formatV2Error(error) {
        return `${error.title}: ${error.detail} (see ${error.type})`;
    }
    createResponseError({ res, data, rateLimit, code }) {
        var _a;
        if (settings_1.TwitterApiV2Settings.debug) {
            settings_1.TwitterApiV2Settings.logger.log(`Request failed with code ${code}, data:`, data);
            settings_1.TwitterApiV2Settings.logger.log('Response headers:', res.headers);
        }
        // Errors formatting.
        let errorString = `Request failed with code ${code}`;
        if ((_a = data === null || data === void 0 ? void 0 : data.errors) === null || _a === void 0 ? void 0 : _a.length) {
            const errors = data.errors;
            if ('code' in errors[0]) {
                errorString += ' - ' + this.formatV1Errors(errors);
            }
            else {
                errorString += ' - ' + this.formatV2Error(data);
            }
        }
        return new types_1.ApiResponseError(errorString, {
            code,
            data,
            headers: res.headers,
            request: this.req,
            response: res,
            rateLimit,
        });
    }
    /* Response helpers */
    getResponseDataStream(res) {
        if (this.isCompressionDisabled()) {
            return res;
        }
        const contentEncoding = (res.headers['content-encoding'] || 'identity').trim().toLowerCase();
        if (contentEncoding === 'br') {
            const brotli = zlib.createBrotliDecompress({
                flush: zlib.constants.BROTLI_OPERATION_FLUSH,
                finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
            });
            res.pipe(brotli);
            return brotli;
        }
        if (contentEncoding === 'gzip') {
            const gunzip = zlib.createGunzip({
                flush: zlib.constants.Z_SYNC_FLUSH,
                finishFlush: zlib.constants.Z_SYNC_FLUSH,
            });
            res.pipe(gunzip);
            return gunzip;
        }
        if (contentEncoding === 'deflate') {
            const inflate = zlib.createInflate({
                flush: zlib.constants.Z_SYNC_FLUSH,
                finishFlush: zlib.constants.Z_SYNC_FLUSH,
            });
            res.pipe(inflate);
            return inflate;
        }
        return res;
    }
    detectResponseType(res) {
        var _a, _b;
        // Auto parse if server responds with JSON body
        if (((_a = res.headers['content-type']) === null || _a === void 0 ? void 0 : _a.includes('application/json')) || ((_b = res.headers['content-type']) === null || _b === void 0 ? void 0 : _b.includes('application/problem+json'))) {
            return 'json';
        }
        // f-e oauth token endpoints
        else if (this.isFormEncodedEndpoint()) {
            return 'url';
        }
        return 'text';
    }
    getParsedResponse(res) {
        const data = this.responseData;
        const mode = this.requestData.forceParseMode || this.detectResponseType(res);
        if (mode === 'buffer') {
            return Buffer.concat(data);
        }
        else if (mode === 'text') {
            return Buffer.concat(data).toString();
        }
        else if (mode === 'json') {
            const asText = Buffer.concat(data).toString();
            return asText.length ? JSON.parse(asText) : undefined;
        }
        else if (mode === 'url') {
            const asText = Buffer.concat(data).toString();
            const formEntries = {};
            for (const [item, value] of new URLSearchParams(asText)) {
                formEntries[item] = value;
            }
            return formEntries;
        }
        else {
            // mode === 'none'
            return undefined;
        }
    }
    getRateLimitFromResponse(res) {
        let rateLimit = undefined;
        if (res.headers['x-rate-limit-limit']) {
            rateLimit = {
                limit: Number(res.headers['x-rate-limit-limit']),
                remaining: Number(res.headers['x-rate-limit-remaining']),
                reset: Number(res.headers['x-rate-limit-reset']),
            };
            if (this.requestData.rateLimitSaver) {
                this.requestData.rateLimitSaver(rateLimit);
            }
        }
        return rateLimit;
    }
    /* Request event handlers */
    onSocketEventHandler(reject, socket) {
        socket.on('close', this.onSocketCloseHandler.bind(this, reject));
    }
    onSocketCloseHandler(reject) {
        this.req.removeAllListeners('timeout');
        const res = this.res;
        if (res) {
            // Response ok, res.close/res.end can handle request ending
            return;
        }
        if (!this.requestErrorHandled) {
            return reject(this.createRequestError(new Error('Socket closed without any information.')));
        }
        // else: other situation
    }
    requestErrorHandler(reject, requestError) {
        var _a, _b;
        (_b = (_a = this.requestData).requestEventDebugHandler) === null || _b === void 0 ? void 0 : _b.call(_a, 'request-error', { requestError });
        this.requestErrorHandled = true;
        reject(this.createRequestError(requestError));
    }
    timeoutErrorHandler() {
        this.requestErrorHandled = true;
        this.req.destroy(new Error('Request timeout.'));
    }
    /* Response event handlers */
    classicResponseHandler(resolve, reject, res) {
        this.res = res;
        const dataStream = this.getResponseDataStream(res);
        // Register the response data
        dataStream.on('data', chunk => this.responseData.push(chunk));
        dataStream.on('end', this.onResponseEndHandler.bind(this, resolve, reject));
        dataStream.on('close', this.onResponseCloseHandler.bind(this, resolve, reject));
        // Debug handlers
        if (this.requestData.requestEventDebugHandler) {
            this.requestData.requestEventDebugHandler('response', { res });
            res.on('aborted', error => this.requestData.requestEventDebugHandler('response-aborted', { error }));
            res.on('error', error => this.requestData.requestEventDebugHandler('response-error', { error }));
            res.on('close', () => this.requestData.requestEventDebugHandler('response-close', { data: this.responseData }));
            res.on('end', () => this.requestData.requestEventDebugHandler('response-end'));
        }
    }
    onResponseEndHandler(resolve, reject) {
        const rateLimit = this.getRateLimitFromResponse(this.res);
        let data;
        try {
            data = this.getParsedResponse(this.res);
        }
        catch (e) {
            reject(this.createPartialResponseError(e, false));
            return;
        }
        // Handle bad error codes
        const code = this.res.statusCode;
        if (code >= 400) {
            reject(this.createResponseError({ data, res: this.res, rateLimit, code }));
            return;
        }
        if (settings_1.TwitterApiV2Settings.debug) {
            settings_1.TwitterApiV2Settings.logger.log(`[${this.requestData.options.method} ${this.hrefPathname}]: Request succeeds with code ${this.res.statusCode}`);
            settings_1.TwitterApiV2Settings.logger.log('Response body:', data);
        }
        resolve({
            data,
            headers: this.res.headers,
            rateLimit,
        });
    }
    onResponseCloseHandler(resolve, reject) {
        const res = this.res;
        if (res.aborted) {
            // Try to parse the request (?)
            try {
                this.getParsedResponse(this.res);
                // Ok, try to resolve normally the request
                return this.onResponseEndHandler(resolve, reject);
            }
            catch (e) {
                // Parse error, just drop with content
                return reject(this.createPartialResponseError(e, true));
            }
        }
        if (!res.complete) {
            return reject(this.createPartialResponseError(new Error('Response has been interrupted before response could be parsed.'), true));
        }
        // else: end has been called
    }
    streamResponseHandler(resolve, reject, res) {
        const code = res.statusCode;
        if (code < 400) {
            if (settings_1.TwitterApiV2Settings.debug) {
                settings_1.TwitterApiV2Settings.logger.log(`[${this.requestData.options.method} ${this.hrefPathname}]: Request succeeds with code ${res.statusCode} (starting stream)`);
            }
            const dataStream = this.getResponseDataStream(res);
            // HTTP code ok, consume stream
            resolve({ req: this.req, res: dataStream, originalResponse: res, requestData: this.requestData });
        }
        else {
            // Handle response normally, can only rejects
            this.classicResponseHandler(() => undefined, reject, res);
        }
    }
    /* Wrappers for request lifecycle */
    debugRequest() {
        const url = this.requestData.url;
        settings_1.TwitterApiV2Settings.logger.log(`[${this.requestData.options.method} ${this.hrefPathname}]`, this.requestData.options);
        if (url.search) {
            settings_1.TwitterApiV2Settings.logger.log('Request parameters:', [...url.searchParams.entries()].map(([key, value]) => `${key}: ${value}`));
        }
        if (this.requestData.body) {
            settings_1.TwitterApiV2Settings.logger.log('Request body:', this.requestData.body);
        }
    }
    buildRequest() {
        var _a;
        const url = this.requestData.url;
        const auth = url.username ? `${url.username}:${url.password}` : undefined;
        const headers = (_a = this.requestData.options.headers) !== null && _a !== void 0 ? _a : {};
        if (this.requestData.compression === true || this.requestData.compression === 'brotli') {
            headers['accept-encoding'] = 'br;q=1.0, gzip;q=0.8, deflate;q=0.5, *;q=0.1';
        }
        else if (this.requestData.compression === 'gzip') {
            headers['accept-encoding'] = 'gzip;q=1, deflate;q=0.5, *;q=0.1';
        }
        else if (this.requestData.compression === 'deflate') {
            headers['accept-encoding'] = 'deflate;q=1, *;q=0.1';
        }
        if (settings_1.TwitterApiV2Settings.debug) {
            this.debugRequest();
        }
        this.req = (0, https_1.request)({
            ...this.requestData.options,
            // Define URL params manually, addresses dependencies error https://github.com/PLhery/node-twitter-api-v2/issues/94
            host: url.hostname,
            port: url.port || undefined,
            path: url.pathname + url.search,
            protocol: url.protocol,
            auth,
            headers,
        });
    }
    registerRequestEventDebugHandlers(req) {
        req.on('close', () => this.requestData.requestEventDebugHandler('close'));
        req.on('abort', () => this.requestData.requestEventDebugHandler('abort'));
        req.on('socket', socket => {
            this.requestData.requestEventDebugHandler('socket', { socket });
            socket.on('error', error => this.requestData.requestEventDebugHandler('socket-error', { socket, error }));
            socket.on('connect', () => this.requestData.requestEventDebugHandler('socket-connect', { socket }));
            socket.on('close', withError => this.requestData.requestEventDebugHandler('socket-close', { socket, withError }));
            socket.on('end', () => this.requestData.requestEventDebugHandler('socket-end', { socket }));
            socket.on('lookup', (...data) => this.requestData.requestEventDebugHandler('socket-lookup', { socket, data }));
            socket.on('timeout', () => this.requestData.requestEventDebugHandler('socket-timeout', { socket }));
        });
    }
    makeRequest() {
        this.buildRequest();
        return new Promise((resolve, reject) => {
            const req = this.req;
            // Handle request errors
            req.on('error', this.requestErrorHandler.bind(this, reject));
            req.on('socket', this.onSocketEventHandler.bind(this, reject));
            req.on('response', this.classicResponseHandler.bind(this, resolve, reject));
            if (this.requestData.options.timeout) {
                req.on('timeout', this.timeoutErrorHandler.bind(this));
            }
            // Debug handlers
            if (this.requestData.requestEventDebugHandler) {
                this.registerRequestEventDebugHandlers(req);
            }
            if (this.requestData.body) {
                req.write(this.requestData.body);
            }
            req.end();
        });
    }
    async makeRequestAsStream() {
        const { req, res, requestData, originalResponse } = await this.makeRequestAndResolveWhenReady();
        return new TweetStream_1.default(requestData, { req, res, originalResponse });
    }
    makeRequestAndResolveWhenReady() {
        this.buildRequest();
        return new Promise((resolve, reject) => {
            const req = this.req;
            // Handle request errors
            req.on('error', this.requestErrorHandler.bind(this, reject));
            req.on('response', this.streamResponseHandler.bind(this, resolve, reject));
            if (this.requestData.body) {
                req.write(this.requestData.body);
            }
            req.end();
        });
    }
}
exports.RequestHandlerHelper = RequestHandlerHelper;
exports.default = RequestHandlerHelper;
