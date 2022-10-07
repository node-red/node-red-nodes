"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRequestMaker = void 0;
const types_1 = require("../types");
const TweetStream_1 = __importDefault(require("../stream/TweetStream"));
const helpers_1 = require("../plugins/helpers");
const helpers_2 = require("../helpers");
const oauth1_helper_1 = __importDefault(require("./oauth1.helper"));
const request_handler_helper_1 = __importDefault(require("./request-handler.helper"));
const request_param_helper_1 = __importDefault(require("./request-param.helper"));
const oauth2_helper_1 = require("./oauth2.helper");
class ClientRequestMaker {
    constructor(settings) {
        this.rateLimits = {};
        this.clientSettings = {};
        if (settings) {
            this.clientSettings = settings;
        }
    }
    /** @deprecated - Switch to `@twitter-api-v2/plugin-rate-limit` */
    getRateLimits() {
        return this.rateLimits;
    }
    saveRateLimit(originalUrl, rateLimit) {
        this.rateLimits[originalUrl] = rateLimit;
    }
    /** Send a new request and returns a wrapped `Promise<TwitterResponse<T>`. */
    async send(requestParams) {
        var _a, _b, _c, _d, _e;
        // Pre-request config hooks
        if ((_a = this.clientSettings.plugins) === null || _a === void 0 ? void 0 : _a.length) {
            const possibleResponse = await this.applyPreRequestConfigHooks(requestParams);
            if (possibleResponse) {
                return possibleResponse;
            }
        }
        const args = this.getHttpRequestArgs(requestParams);
        const options = {
            method: args.method,
            headers: args.headers,
            timeout: requestParams.timeout,
            agent: this.clientSettings.httpAgent,
        };
        const enableRateLimitSave = requestParams.enableRateLimitSave !== false;
        if (args.body) {
            request_param_helper_1.default.setBodyLengthHeader(options, args.body);
        }
        // Pre-request hooks
        if ((_b = this.clientSettings.plugins) === null || _b === void 0 ? void 0 : _b.length) {
            await this.applyPreRequestHooks(requestParams, args, options);
        }
        let request = new request_handler_helper_1.default({
            url: args.url,
            options,
            body: args.body,
            rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
            requestEventDebugHandler: requestParams.requestEventDebugHandler,
            compression: (_d = (_c = requestParams.compression) !== null && _c !== void 0 ? _c : this.clientSettings.compression) !== null && _d !== void 0 ? _d : true,
            forceParseMode: requestParams.forceParseMode,
        })
            .makeRequest();
        if ((0, helpers_1.hasRequestErrorPlugins)(this)) {
            request = this.applyResponseErrorHooks(requestParams, args, options, request);
        }
        const response = await request;
        // Post-request hooks
        if ((_e = this.clientSettings.plugins) === null || _e === void 0 ? void 0 : _e.length) {
            const responseOverride = await this.applyPostRequestHooks(requestParams, args, options, response);
            if (responseOverride) {
                return responseOverride.value;
            }
        }
        return response;
    }
    sendStream(requestParams) {
        var _a, _b;
        // Pre-request hooks
        if (this.clientSettings.plugins) {
            this.applyPreStreamRequestConfigHooks(requestParams);
        }
        const args = this.getHttpRequestArgs(requestParams);
        const options = {
            method: args.method,
            headers: args.headers,
            agent: this.clientSettings.httpAgent,
        };
        const enableRateLimitSave = requestParams.enableRateLimitSave !== false;
        const enableAutoConnect = requestParams.autoConnect !== false;
        if (args.body) {
            request_param_helper_1.default.setBodyLengthHeader(options, args.body);
        }
        const requestData = {
            url: args.url,
            options,
            body: args.body,
            rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
            payloadIsError: requestParams.payloadIsError,
            compression: (_b = (_a = requestParams.compression) !== null && _a !== void 0 ? _a : this.clientSettings.compression) !== null && _b !== void 0 ? _b : true,
        };
        const stream = new TweetStream_1.default(requestData);
        if (!enableAutoConnect) {
            return stream;
        }
        return stream.connect();
    }
    /* Token helpers */
    initializeToken(token) {
        if (typeof token === 'string') {
            this.bearerToken = token;
        }
        else if (typeof token === 'object' && 'appKey' in token) {
            this.consumerToken = token.appKey;
            this.consumerSecret = token.appSecret;
            if (token.accessToken && token.accessSecret) {
                this.accessToken = token.accessToken;
                this.accessSecret = token.accessSecret;
            }
            this._oauth = this.buildOAuth();
        }
        else if (typeof token === 'object' && 'username' in token) {
            const key = encodeURIComponent(token.username) + ':' + encodeURIComponent(token.password);
            this.basicToken = Buffer.from(key).toString('base64');
        }
        else if (typeof token === 'object' && 'clientId' in token) {
            this.clientId = token.clientId;
            this.clientSecret = token.clientSecret;
        }
    }
    getActiveTokens() {
        if (this.bearerToken) {
            return {
                type: 'oauth2',
                bearerToken: this.bearerToken,
            };
        }
        else if (this.basicToken) {
            return {
                type: 'basic',
                token: this.basicToken,
            };
        }
        else if (this.consumerSecret && this._oauth) {
            return {
                type: 'oauth-1.0a',
                appKey: this.consumerToken,
                appSecret: this.consumerSecret,
                accessToken: this.accessToken,
                accessSecret: this.accessSecret,
            };
        }
        else if (this.clientId) {
            return {
                type: 'oauth2-user',
                clientId: this.clientId,
            };
        }
        return { type: 'none' };
    }
    buildOAuth() {
        if (!this.consumerSecret || !this.consumerToken)
            throw new Error('Invalid consumer tokens');
        return new oauth1_helper_1.default({
            consumerKeys: { key: this.consumerToken, secret: this.consumerSecret },
        });
    }
    getOAuthAccessTokens() {
        if (!this.accessSecret || !this.accessToken)
            return;
        return {
            key: this.accessToken,
            secret: this.accessSecret,
        };
    }
    /* Plugin helpers */
    getPlugins() {
        var _a;
        return (_a = this.clientSettings.plugins) !== null && _a !== void 0 ? _a : [];
    }
    hasPlugins() {
        var _a;
        return !!((_a = this.clientSettings.plugins) === null || _a === void 0 ? void 0 : _a.length);
    }
    async applyPluginMethod(method, args) {
        var _a;
        let returnValue;
        for (const plugin of this.getPlugins()) {
            const value = await ((_a = plugin[method]) === null || _a === void 0 ? void 0 : _a.call(plugin, args));
            if (value && value instanceof types_1.TwitterApiPluginResponseOverride) {
                returnValue = value;
            }
        }
        return returnValue;
    }
    /* Request helpers */
    writeAuthHeaders({ headers, bodyInSignature, url, method, query, body }) {
        headers = { ...headers };
        if (this.bearerToken) {
            headers.Authorization = 'Bearer ' + this.bearerToken;
        }
        else if (this.basicToken) {
            // Basic auth, to request a bearer token
            headers.Authorization = 'Basic ' + this.basicToken;
        }
        else if (this.clientId && this.clientSecret) {
            // Basic auth with clientId + clientSecret
            headers.Authorization = 'Basic ' + oauth2_helper_1.OAuth2Helper.getAuthHeader(this.clientId, this.clientSecret);
        }
        else if (this.consumerSecret && this._oauth) {
            // Merge query and body
            const data = bodyInSignature ? request_param_helper_1.default.mergeQueryAndBodyForOAuth(query, body) : query;
            const auth = this._oauth.authorize({
                url: url.toString(),
                method,
                data,
            }, this.getOAuthAccessTokens());
            headers = { ...headers, ...this._oauth.toHeader(auth) };
        }
        return headers;
    }
    getUrlObjectFromUrlString(url) {
        // Add protocol to URL if needed
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        // Convert URL to object that will receive all URL modifications
        return new URL(url);
    }
    getHttpRequestArgs({ url: stringUrl, method, query: rawQuery = {}, body: rawBody = {}, headers, forceBodyMode, enableAuth, params, }) {
        let body = undefined;
        method = method.toUpperCase();
        headers = headers !== null && headers !== void 0 ? headers : {};
        // Add user agent header (Twitter recommends it)
        if (!headers['x-user-agent']) {
            headers['x-user-agent'] = 'Node.twitter-api-v2';
        }
        const url = this.getUrlObjectFromUrlString(stringUrl);
        // URL without query string to save as endpoint name
        const rawUrl = url.origin + url.pathname;
        // Apply URL parameters
        if (params) {
            request_param_helper_1.default.applyRequestParametersToUrl(url, params);
        }
        // Build a URL without anything in QS, and QSP in query
        const query = request_param_helper_1.default.formatQueryToString(rawQuery);
        request_param_helper_1.default.moveUrlQueryParamsIntoObject(url, query);
        // Delete undefined parameters
        if (!(rawBody instanceof Buffer)) {
            (0, helpers_2.trimUndefinedProperties)(rawBody);
        }
        // OAuth signature should not include parameters when using multipart.
        const bodyType = forceBodyMode !== null && forceBodyMode !== void 0 ? forceBodyMode : request_param_helper_1.default.autoDetectBodyType(url);
        // If undefined or true, enable auth by headers
        if (enableAuth !== false) {
            // OAuth needs body signature only if body is URL encoded.
            const bodyInSignature = ClientRequestMaker.BODY_METHODS.has(method) && bodyType === 'url';
            headers = this.writeAuthHeaders({ headers, bodyInSignature, method, query, url, body: rawBody });
        }
        if (ClientRequestMaker.BODY_METHODS.has(method)) {
            body = request_param_helper_1.default.constructBodyParams(rawBody, headers, bodyType) || undefined;
        }
        request_param_helper_1.default.addQueryParamsToUrl(url, query);
        return {
            rawUrl,
            url,
            method,
            headers,
            body,
        };
    }
    /* Plugin helpers */
    async applyPreRequestConfigHooks(requestParams) {
        var _a;
        const url = this.getUrlObjectFromUrlString(requestParams.url);
        for (const plugin of this.getPlugins()) {
            const result = await ((_a = plugin.onBeforeRequestConfig) === null || _a === void 0 ? void 0 : _a.call(plugin, {
                client: this,
                url,
                params: requestParams,
            }));
            if (result) {
                return result;
            }
        }
    }
    applyPreStreamRequestConfigHooks(requestParams) {
        var _a;
        const url = this.getUrlObjectFromUrlString(requestParams.url);
        for (const plugin of this.getPlugins()) {
            (_a = plugin.onBeforeStreamRequestConfig) === null || _a === void 0 ? void 0 : _a.call(plugin, {
                client: this,
                url,
                params: requestParams,
            });
        }
    }
    async applyPreRequestHooks(requestParams, computedParams, requestOptions) {
        await this.applyPluginMethod('onBeforeRequest', {
            client: this,
            url: this.getUrlObjectFromUrlString(requestParams.url),
            params: requestParams,
            computedParams,
            requestOptions,
        });
    }
    async applyPostRequestHooks(requestParams, computedParams, requestOptions, response) {
        return await this.applyPluginMethod('onAfterRequest', {
            client: this,
            url: this.getUrlObjectFromUrlString(requestParams.url),
            params: requestParams,
            computedParams,
            requestOptions,
            response,
        });
    }
    applyResponseErrorHooks(requestParams, computedParams, requestOptions, promise) {
        return promise.catch(helpers_1.applyResponseHooks.bind(this, requestParams, computedParams, requestOptions));
    }
}
exports.ClientRequestMaker = ClientRequestMaker;
ClientRequestMaker.BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
