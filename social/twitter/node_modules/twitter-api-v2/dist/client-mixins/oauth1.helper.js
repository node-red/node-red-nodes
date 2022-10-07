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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth1Helper = void 0;
const crypto = __importStar(require("crypto"));
class OAuth1Helper {
    constructor(options) {
        this.nonceLength = 32;
        this.consumerKeys = options.consumerKeys;
    }
    static percentEncode(str) {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/\*/g, '%2A')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29');
    }
    hash(base, key) {
        return crypto
            .createHmac('sha1', key)
            .update(base)
            .digest('base64');
    }
    authorize(request, accessTokens = {}) {
        const oauthInfo = {
            oauth_consumer_key: this.consumerKeys.key,
            oauth_nonce: this.getNonce(),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: this.getTimestamp(),
            oauth_version: '1.0',
        };
        if (accessTokens.key !== undefined) {
            oauthInfo.oauth_token = accessTokens.key;
        }
        if (!request.data) {
            request.data = {};
        }
        oauthInfo.oauth_signature = this.getSignature(request, accessTokens.secret, oauthInfo);
        return oauthInfo;
    }
    toHeader(oauthInfo) {
        const sorted = sortObject(oauthInfo);
        let header_value = 'OAuth ';
        for (const element of sorted) {
            if (element.key.indexOf('oauth_') !== 0) {
                continue;
            }
            header_value += OAuth1Helper.percentEncode(element.key) + '="' + OAuth1Helper.percentEncode(element.value) + '",';
        }
        return {
            // Remove the last ,
            Authorization: header_value.slice(0, header_value.length - 1),
        };
    }
    getNonce() {
        const wordCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < this.nonceLength; i++) {
            result += wordCharacters[Math.trunc(Math.random() * wordCharacters.length)];
        }
        return result;
    }
    getTimestamp() {
        return Math.trunc(new Date().getTime() / 1000);
    }
    getSignature(request, tokenSecret, oauthInfo) {
        return this.hash(this.getBaseString(request, oauthInfo), this.getSigningKey(tokenSecret));
    }
    getSigningKey(tokenSecret) {
        return OAuth1Helper.percentEncode(this.consumerKeys.secret) + '&' + OAuth1Helper.percentEncode(tokenSecret || '');
    }
    getBaseString(request, oauthInfo) {
        return request.method.toUpperCase() + '&'
            + OAuth1Helper.percentEncode(this.getBaseUrl(request.url)) + '&'
            + OAuth1Helper.percentEncode(this.getParameterString(request, oauthInfo));
    }
    getParameterString(request, oauthInfo) {
        const baseStringData = sortObject(percentEncodeData(mergeObject(oauthInfo, mergeObject(request.data, deParamUrl(request.url)))));
        let dataStr = '';
        for (const { key, value } of baseStringData) {
            // check if the value is an array
            // this means that this key has multiple values
            if (value && Array.isArray(value)) {
                // sort the array first
                value.sort();
                let valString = '';
                // serialize all values for this key: e.g. formkey=formvalue1&formkey=formvalue2
                value.forEach((item, i) => {
                    valString += key + '=' + item;
                    if (i < value.length) {
                        valString += '&';
                    }
                });
                dataStr += valString;
            }
            else {
                dataStr += key + '=' + value + '&';
            }
        }
        // Remove the last character
        return dataStr.slice(0, dataStr.length - 1);
    }
    getBaseUrl(url) {
        return url.split('?')[0];
    }
}
exports.OAuth1Helper = OAuth1Helper;
exports.default = OAuth1Helper;
// Helper functions //
function mergeObject(obj1, obj2) {
    return {
        ...obj1 || {},
        ...obj2 || {},
    };
}
function sortObject(data) {
    return Object.keys(data)
        .sort()
        .map(key => ({ key, value: data[key] }));
}
function deParam(string) {
    const splitted = string.split('&');
    const data = {};
    for (const coupleKeyValue of splitted) {
        const [key, value = ''] = coupleKeyValue.split('=');
        // check if the key already exists
        // this can occur if the QS part of the url contains duplicate keys like this: ?formkey=formvalue1&formkey=formvalue2
        if (data[key]) {
            // the key exists already
            if (!Array.isArray(data[key])) {
                // replace the value with an array containing the already present value
                data[key] = [data[key]];
            }
            // and add the new found value to it
            data[key].push(decodeURIComponent(value));
        }
        else {
            // it doesn't exist, just put the found value in the data object
            data[key] = decodeURIComponent(value);
        }
    }
    return data;
}
function deParamUrl(url) {
    const tmp = url.split('?');
    if (tmp.length === 1)
        return {};
    return deParam(tmp[1]);
}
function percentEncodeData(data) {
    const result = {};
    for (const key in data) {
        let value = data[key];
        // check if the value is an array
        if (value && Array.isArray(value)) {
            value = value.map(v => OAuth1Helper.percentEncode(v));
        }
        else {
            value = OAuth1Helper.percentEncode(value);
        }
        result[OAuth1Helper.percentEncode(key)] = value;
    }
    return result;
}
