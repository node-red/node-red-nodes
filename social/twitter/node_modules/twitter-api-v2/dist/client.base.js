"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_maker_mixin_1 = require("./client-mixins/request-maker.mixin");
const helpers_1 = require("./helpers");
const globals_1 = require("./globals");
/**
 * Base class for Twitter instances
 */
class TwitterApiBase {
    constructor(token, settings = {}) {
        this._currentUser = null;
        this._currentUserV2 = null;
        if (token instanceof TwitterApiBase) {
            this._requestMaker = token._requestMaker;
        }
        else {
            this._requestMaker = new request_maker_mixin_1.ClientRequestMaker(settings);
            this._requestMaker.initializeToken(token);
        }
    }
    /* Prefix/Token handling */
    setPrefix(prefix) {
        this._prefix = prefix;
    }
    cloneWithPrefix(prefix) {
        const clone = this.constructor(this);
        clone.setPrefix(prefix);
        return clone;
    }
    getActiveTokens() {
        return this._requestMaker.getActiveTokens();
    }
    /* Rate limit cache / Plugins */
    getPlugins() {
        return this._requestMaker.getPlugins();
    }
    getPluginOfType(type) {
        return this.getPlugins().find(plugin => plugin instanceof type);
    }
    /**
     * @deprecated - Migrate to plugin `@twitter-api-v2/plugin-rate-limit`
     *
     * Tells if you hit the Twitter rate limit for {endpoint}.
     * (local data only, this should not ask anything to Twitter)
     */
    hasHitRateLimit(endpoint) {
        var _a;
        if (this.isRateLimitStatusObsolete(endpoint)) {
            return false;
        }
        return ((_a = this.getLastRateLimitStatus(endpoint)) === null || _a === void 0 ? void 0 : _a.remaining) === 0;
    }
    /**
     * @deprecated - Migrate to plugin `@twitter-api-v2/plugin-rate-limit`
     *
     * Tells if you hit the returned Twitter rate limit for {endpoint} has expired.
     * If client has no saved rate limit data for {endpoint}, this will gives you `true`.
     */
    isRateLimitStatusObsolete(endpoint) {
        const rateLimit = this.getLastRateLimitStatus(endpoint);
        if (rateLimit === undefined) {
            return true;
        }
        // Timestamps are exprimed in seconds, JS works with ms
        return (rateLimit.reset * 1000) < Date.now();
    }
    /**
     * @deprecated - Migrate to plugin `@twitter-api-v2/plugin-rate-limit`
     *
     * Get the last obtained Twitter rate limit information for {endpoint}.
     * (local data only, this should not ask anything to Twitter)
     */
    getLastRateLimitStatus(endpoint) {
        const endpointWithPrefix = endpoint.match(/^https?:\/\//) ? endpoint : (this._prefix + endpoint);
        return this._requestMaker.getRateLimits()[endpointWithPrefix];
    }
    /* Current user cache */
    /** Get cached current user. */
    getCurrentUserObject(forceFetch = false) {
        if (!forceFetch && this._currentUser) {
            if (this._currentUser.value) {
                return Promise.resolve(this._currentUser.value);
            }
            return this._currentUser.promise;
        }
        this._currentUser = (0, helpers_1.sharedPromise)(() => this.get('account/verify_credentials.json', { tweet_mode: 'extended' }, { prefix: globals_1.API_V1_1_PREFIX }));
        return this._currentUser.promise;
    }
    /**
     * Get cached current user from v2 API.
     * This can only be the slimest available `UserV2` object, with only `id`, `name` and `username` properties defined.
     *
     * To get a customized `UserV2Result`, use `.v2.me()`
     *
     * OAuth2 scopes: `tweet.read` & `users.read`
     */
    getCurrentUserV2Object(forceFetch = false) {
        if (!forceFetch && this._currentUserV2) {
            if (this._currentUserV2.value) {
                return Promise.resolve(this._currentUserV2.value);
            }
            return this._currentUserV2.promise;
        }
        this._currentUserV2 = (0, helpers_1.sharedPromise)(() => this.get('users/me', undefined, { prefix: globals_1.API_V2_PREFIX }));
        return this._currentUserV2.promise;
    }
    async get(url, query = {}, { fullResponse, prefix = this._prefix, ...rest } = {}) {
        if (prefix)
            url = prefix + url;
        const resp = await this._requestMaker.send({
            url,
            method: 'GET',
            query,
            ...rest,
        });
        return fullResponse ? resp : resp.data;
    }
    async delete(url, query = {}, { fullResponse, prefix = this._prefix, ...rest } = {}) {
        if (prefix)
            url = prefix + url;
        const resp = await this._requestMaker.send({
            url,
            method: 'DELETE',
            query,
            ...rest,
        });
        return fullResponse ? resp : resp.data;
    }
    async post(url, body, { fullResponse, prefix = this._prefix, ...rest } = {}) {
        if (prefix)
            url = prefix + url;
        const resp = await this._requestMaker.send({
            url,
            method: 'POST',
            body,
            ...rest,
        });
        return fullResponse ? resp : resp.data;
    }
    async put(url, body, { fullResponse, prefix = this._prefix, ...rest } = {}) {
        if (prefix)
            url = prefix + url;
        const resp = await this._requestMaker.send({
            url,
            method: 'PUT',
            body,
            ...rest,
        });
        return fullResponse ? resp : resp.data;
    }
    async patch(url, body, { fullResponse, prefix = this._prefix, ...rest } = {}) {
        if (prefix)
            url = prefix + url;
        const resp = await this._requestMaker.send({
            url,
            method: 'PATCH',
            body,
            ...rest,
        });
        return fullResponse ? resp : resp.data;
    }
    getStream(url, query, { prefix = this._prefix, ...rest } = {}) {
        return this._requestMaker.sendStream({
            url: prefix ? prefix + url : url,
            method: 'GET',
            query,
            ...rest,
        });
    }
    postStream(url, body, { prefix = this._prefix, ...rest } = {}) {
        return this._requestMaker.sendStream({
            url: prefix ? prefix + url : url,
            method: 'POST',
            body,
            ...rest,
        });
    }
}
exports.default = TwitterApiBase;
