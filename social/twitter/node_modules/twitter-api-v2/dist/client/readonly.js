"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
const client_base_1 = __importDefault(require("../client.base"));
const client_v1_read_1 = __importDefault(require("../v1/client.v1.read"));
const client_v2_read_1 = __importDefault(require("../v2/client.v2.read"));
const oauth2_helper_1 = require("../client-mixins/oauth2.helper");
const request_param_helper_1 = __importDefault(require("../client-mixins/request-param.helper"));
/**
 * Twitter v1.1 and v2 API client.
 */
class TwitterApiReadOnly extends client_base_1.default {
    /* Direct access to subclients */
    get v1() {
        if (this._v1)
            return this._v1;
        return this._v1 = new client_v1_read_1.default(this);
    }
    get v2() {
        if (this._v2)
            return this._v2;
        return this._v2 = new client_v2_read_1.default(this);
    }
    /**
     * Fetch and cache current user.
     * This method can only be called with a OAuth 1.0a user authentication.
     *
     * You can use this method to test if authentication was successful.
     * Next calls to this methods will use the cached user, unless `forceFetch: true` is given.
     */
    async currentUser(forceFetch = false) {
        return await this.getCurrentUserObject(forceFetch);
    }
    /**
     * Fetch and cache current user.
     * This method can only be called with a OAuth 1.0a or OAuth2 user authentication.
     *
     * This can only be the slimest available `UserV2` object, with only id, name and username properties defined.
     * To get a customized `UserV2Result`, use `.v2.me()`
     *
     * You can use this method to test if authentication was successful.
     * Next calls to this methods will use the cached user, unless `forceFetch: true` is given.
     *
     * OAuth2 scopes: `tweet.read` & `users.read`
     */
    async currentUserV2(forceFetch = false) {
        return await this.getCurrentUserV2Object(forceFetch);
    }
    /* Shortcuts to endpoints */
    search(what, options) {
        return this.v2.search(what, options);
    }
    /* Authentication */
    /**
     * Generate the OAuth request token link for user-based OAuth 1.0 auth.
     *
     * ```ts
     * // Instanciate TwitterApi with consumer keys
     * const client = new TwitterApi({ appKey: 'consumer_key', appSecret: 'consumer_secret' });
     *
     * const tokenRequest = await client.generateAuthLink('oob-or-your-callback-url');
     * // redirect end-user to tokenRequest.url
     *
     * // Save tokenRequest.oauth_token_secret somewhere, it will be needed for next auth step.
     * ```
     */
    async generateAuthLink(oauth_callback = 'oob', { authAccessType, linkMode = 'authenticate', forceLogin, screenName, } = {}) {
        const oauthResult = await this.post('https://api.twitter.com/oauth/request_token', { oauth_callback, x_auth_access_type: authAccessType });
        let url = `https://api.twitter.com/oauth/${linkMode}?oauth_token=${encodeURIComponent(oauthResult.oauth_token)}`;
        if (forceLogin !== undefined) {
            url += `&force_login=${encodeURIComponent(forceLogin)}`;
        }
        if (screenName !== undefined) {
            url += `&screen_name=${encodeURIComponent(screenName)}`;
        }
        if (this._requestMaker.hasPlugins()) {
            this._requestMaker.applyPluginMethod('onOAuth1RequestToken', {
                client: this._requestMaker,
                url,
                oauthResult,
            });
        }
        return {
            url,
            ...oauthResult,
        };
    }
    /**
     * Obtain access to user-based OAuth 1.0 auth.
     *
     * After user is redirect from your callback, use obtained oauth_token and oauth_verifier to
     * instanciate the new TwitterApi instance.
     *
     * ```ts
     * // Use the saved oauth_token_secret associated to oauth_token returned by callback
     * const requestClient = new TwitterApi({
     *  appKey: 'consumer_key',
     *  appSecret: 'consumer_secret',
     *  accessToken: 'oauth_token',
     *  accessSecret: 'oauth_token_secret'
     * });
     *
     * // Use oauth_verifier obtained from callback request
     * const { client: userClient } = await requestClient.login('oauth_verifier');
     *
     * // {userClient} is a valid {TwitterApi} object you can use for future requests
     * ```
     */
    async login(oauth_verifier) {
        const tokens = this.getActiveTokens();
        if (tokens.type !== 'oauth-1.0a')
            throw new Error('You must setup TwitterApi instance with consumer keys to accept OAuth 1.0 login');
        const oauth_result = await this.post('https://api.twitter.com/oauth/access_token', { oauth_token: tokens.accessToken, oauth_verifier });
        const client = new _1.default({
            appKey: tokens.appKey,
            appSecret: tokens.appSecret,
            accessToken: oauth_result.oauth_token,
            accessSecret: oauth_result.oauth_token_secret,
        }, this._requestMaker.clientSettings);
        return {
            accessToken: oauth_result.oauth_token,
            accessSecret: oauth_result.oauth_token_secret,
            userId: oauth_result.user_id,
            screenName: oauth_result.screen_name,
            client,
        };
    }
    /**
     * Enable application-only authentication.
     *
     * To make the request, instanciate TwitterApi with consumer and secret.
     *
     * ```ts
     * const requestClient = new TwitterApi({ appKey: 'consumer', appSecret: 'secret' });
     * const appClient = await requestClient.appLogin();
     *
     * // Use {appClient} to make requests
     * ```
     */
    async appLogin() {
        const tokens = this.getActiveTokens();
        if (tokens.type !== 'oauth-1.0a')
            throw new Error('You must setup TwitterApi instance with consumer keys to accept app-only login');
        // Create a client with Basic authentication
        const basicClient = new _1.default({ username: tokens.appKey, password: tokens.appSecret });
        const res = await basicClient.post('https://api.twitter.com/oauth2/token', { grant_type: 'client_credentials' });
        // New object with Bearer token
        return new _1.default(res.access_token, this._requestMaker.clientSettings);
    }
    /* OAuth 2 user authentication */
    /**
     * Generate the OAuth request token link for user-based OAuth 2.0 auth.
     *
     * - **You can only use v2 API endpoints with this authentication method.**
     * - **You need to specify which scope you want to have when you create your auth link. Make sure it matches your needs.**
     *
     * See https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token for details.
     *
     * ```ts
     * // Instanciate TwitterApi with client ID
     * const client = new TwitterApi({ clientId: 'yourClientId' });
     *
     * // Generate a link to callback URL that will gives a token with tweet+user read access
     * const link = client.generateOAuth2AuthLink('your-callback-url', { scope: ['tweet.read', 'users.read'] });
     *
     * // Extract props from generate link
     * const { url, state, codeVerifier } = link;
     *
     * // redirect end-user to url
     * // Save `state` and `codeVerifier` somewhere, it will be needed for next auth step.
     * ```
     */
    generateOAuth2AuthLink(redirectUri, options = {}) {
        var _a, _b;
        if (!this._requestMaker.clientId) {
            throw new Error('Twitter API instance is not initialized with client ID. You can find your client ID in Twitter Developer Portal. ' +
                'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })');
        }
        const state = (_a = options.state) !== null && _a !== void 0 ? _a : oauth2_helper_1.OAuth2Helper.generateRandomString(32);
        const codeVerifier = oauth2_helper_1.OAuth2Helper.getCodeVerifier();
        const codeChallenge = oauth2_helper_1.OAuth2Helper.getCodeChallengeFromVerifier(codeVerifier);
        const rawScope = (_b = options.scope) !== null && _b !== void 0 ? _b : '';
        const scope = Array.isArray(rawScope) ? rawScope.join(' ') : rawScope;
        const url = new URL('https://twitter.com/i/oauth2/authorize');
        const query = {
            response_type: 'code',
            client_id: this._requestMaker.clientId,
            redirect_uri: redirectUri,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 's256',
            scope,
        };
        request_param_helper_1.default.addQueryParamsToUrl(url, query);
        const result = {
            url: url.toString(),
            state,
            codeVerifier,
            codeChallenge,
        };
        if (this._requestMaker.hasPlugins()) {
            this._requestMaker.applyPluginMethod('onOAuth2RequestToken', {
                client: this._requestMaker,
                result,
                redirectUri,
            });
        }
        return result;
    }
    /**
     * Obtain access to user-based OAuth 2.0 auth.
     *
     * After user is redirect from your callback, use obtained code to
     * instanciate the new TwitterApi instance.
     *
     * You need to obtain `codeVerifier` from a call to `.generateOAuth2AuthLink`.
     *
     * ```ts
     * // Use the saved codeVerifier associated to state (present in query string of callback)
     * const requestClient = new TwitterApi({ clientId: 'yourClientId' });
     *
     * const { client: userClient, refreshToken } = await requestClient.loginWithOAuth2({
     *  code: 'codeFromQueryString',
     *  // the same URL given to generateOAuth2AuthLink
     *  redirectUri,
     *  // the verifier returned by generateOAuth2AuthLink
     *  codeVerifier,
     * });
     *
     * // {userClient} is a valid {TwitterApi} object you can use for future requests
     * // {refreshToken} is defined if 'offline.access' is in scope.
     * ```
     */
    async loginWithOAuth2({ code, codeVerifier, redirectUri }) {
        if (!this._requestMaker.clientId) {
            throw new Error('Twitter API instance is not initialized with client ID. ' +
                'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })');
        }
        const accessTokenResult = await this.post('https://api.twitter.com/2/oauth2/token', {
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            client_id: this._requestMaker.clientId,
            client_secret: this._requestMaker.clientSecret,
        });
        return this.parseOAuth2AccessTokenResult(accessTokenResult);
    }
    /**
     * Obtain a new access token to user-based OAuth 2.0 auth from a refresh token.
     *
     * ```ts
     * const requestClient = new TwitterApi({ clientId: 'yourClientId' });
     *
     * const { client: userClient } = await requestClient.refreshOAuth2Token('refreshToken');
     * // {userClient} is a valid {TwitterApi} object you can use for future requests
     * ```
     */
    async refreshOAuth2Token(refreshToken) {
        if (!this._requestMaker.clientId) {
            throw new Error('Twitter API instance is not initialized with client ID. ' +
                'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })');
        }
        const accessTokenResult = await this.post('https://api.twitter.com/2/oauth2/token', {
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            client_id: this._requestMaker.clientId,
            client_secret: this._requestMaker.clientSecret,
        });
        return this.parseOAuth2AccessTokenResult(accessTokenResult);
    }
    /**
     * Revoke a single user-based OAuth 2.0 token.
     *
     * You must specify its source, access token (directly after login)
     * or refresh token (if you've called `.refreshOAuth2Token` before).
     */
    async revokeOAuth2Token(token, tokenType = 'access_token') {
        if (!this._requestMaker.clientId) {
            throw new Error('Twitter API instance is not initialized with client ID. ' +
                'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })');
        }
        return await this.post('https://api.twitter.com/2/oauth2/revoke', {
            client_id: this._requestMaker.clientId,
            client_secret: this._requestMaker.clientSecret,
            token,
            token_type_hint: tokenType,
        });
    }
    parseOAuth2AccessTokenResult(result) {
        const client = new _1.default(result.access_token, this._requestMaker.clientSettings);
        const scope = result.scope.split(' ').filter(e => e);
        return {
            client,
            expiresIn: result.expires_in,
            accessToken: result.access_token,
            scope,
            refreshToken: result.refresh_token,
        };
    }
}
exports.default = TwitterApiReadOnly;
