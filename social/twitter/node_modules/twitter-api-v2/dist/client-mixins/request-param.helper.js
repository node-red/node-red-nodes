"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestParamHelpers = void 0;
const form_data_helper_1 = require("./form-data.helper");
const oauth1_helper_1 = __importDefault(require("./oauth1.helper"));
/* Helpers functions that are specific to this class but do not depends on instance */
class RequestParamHelpers {
    static formatQueryToString(query) {
        const formattedQuery = {};
        for (const prop in query) {
            if (typeof query[prop] === 'string') {
                formattedQuery[prop] = query[prop];
            }
            else if (typeof query[prop] !== 'undefined') {
                formattedQuery[prop] = String(query[prop]);
            }
        }
        return formattedQuery;
    }
    static autoDetectBodyType(url) {
        if (url.pathname.startsWith('/2/') || url.pathname.startsWith('/labs/2/')) {
            // oauth2 takes url encoded
            if (url.password.startsWith('/2/oauth2')) {
                return 'url';
            }
            // Twitter API v2 has JSON-encoded requests for everything else
            return 'json';
        }
        if (url.hostname === 'upload.twitter.com') {
            if (url.pathname === '/1.1/media/upload.json') {
                return 'form-data';
            }
            // json except for media/upload command, that is form-data.
            return 'json';
        }
        const endpoint = url.pathname.split('/1.1/', 2)[1];
        if (this.JSON_1_1_ENDPOINTS.has(endpoint)) {
            return 'json';
        }
        return 'url';
    }
    static addQueryParamsToUrl(url, query) {
        const queryEntries = Object.entries(query);
        if (queryEntries.length) {
            let search = '';
            for (const [key, value] of queryEntries) {
                search += (search.length ? '&' : '?') + `${oauth1_helper_1.default.percentEncode(key)}=${oauth1_helper_1.default.percentEncode(value)}`;
            }
            url.search = search;
        }
    }
    static constructBodyParams(body, headers, mode) {
        if (body instanceof Buffer) {
            return body;
        }
        if (mode === 'json') {
            headers['content-type'] = 'application/json;charset=UTF-8';
            return JSON.stringify(body);
        }
        else if (mode === 'url') {
            headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
            if (Object.keys(body).length) {
                return new URLSearchParams(body)
                    .toString()
                    .replace(/\*/g, '%2A'); // URLSearchParams doesnt encode '*', but Twitter wants it encoded.
            }
            return '';
        }
        else if (mode === 'raw') {
            throw new Error('You can only use raw body mode with Buffers. To give a string, use Buffer.from(str).');
        }
        else {
            const form = new form_data_helper_1.FormDataHelper();
            for (const parameter in body) {
                form.append(parameter, body[parameter]);
            }
            const formHeaders = form.getHeaders();
            headers['content-type'] = formHeaders['content-type'];
            return form.getBuffer();
        }
    }
    static setBodyLengthHeader(options, body) {
        var _a;
        options.headers = (_a = options.headers) !== null && _a !== void 0 ? _a : {};
        if (typeof body === 'string') {
            options.headers['content-length'] = Buffer.byteLength(body);
        }
        else {
            options.headers['content-length'] = body.length;
        }
    }
    static isOAuthSerializable(item) {
        return !(item instanceof Buffer);
    }
    static mergeQueryAndBodyForOAuth(query, body) {
        const parameters = {};
        for (const prop in query) {
            parameters[prop] = query[prop];
        }
        if (this.isOAuthSerializable(body)) {
            for (const prop in body) {
                const bodyProp = body[prop];
                if (this.isOAuthSerializable(bodyProp)) {
                    parameters[prop] = typeof bodyProp === 'object' && bodyProp !== null && 'toString' in bodyProp
                        ? bodyProp.toString()
                        : bodyProp;
                }
            }
        }
        return parameters;
    }
    static moveUrlQueryParamsIntoObject(url, query) {
        for (const [param, value] of url.searchParams) {
            query[param] = value;
        }
        // Remove the query string
        url.search = '';
        return url;
    }
    /**
     * Replace URL parameters available in pathname, like `:id`, with data given in `parameters`:
     * `https://twitter.com/:id.json` + `{ id: '20' }` => `https://twitter.com/20.json`
     */
    static applyRequestParametersToUrl(url, parameters) {
        url.pathname = url.pathname.replace(/:([A-Z_-]+)/ig, (fullMatch, paramName) => {
            if (parameters[paramName] !== undefined) {
                return String(parameters[paramName]);
            }
            return fullMatch;
        });
        return url;
    }
}
exports.RequestParamHelpers = RequestParamHelpers;
RequestParamHelpers.JSON_1_1_ENDPOINTS = new Set([
    'direct_messages/events/new.json',
    'direct_messages/welcome_messages/new.json',
    'direct_messages/welcome_messages/rules/new.json',
    'media/metadata/create.json',
    'collections/entries/curate.json',
]);
exports.default = RequestParamHelpers;
