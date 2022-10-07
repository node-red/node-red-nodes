"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterApiReadOnly = exports.TwitterApiReadWrite = exports.TwitterApi = void 0;
const client_v1_1 = __importDefault(require("../v1/client.v1"));
const client_v2_1 = __importDefault(require("../v2/client.v2"));
const readwrite_1 = __importDefault(require("./readwrite"));
// "Real" exported client for usage of TwitterApi.
/**
 * Twitter v1.1 and v2 API client.
 */
class TwitterApi extends readwrite_1.default {
    /* Direct access to subclients */
    get v1() {
        if (this._v1)
            return this._v1;
        return this._v1 = new client_v1_1.default(this);
    }
    get v2() {
        if (this._v2)
            return this._v2;
        return this._v2 = new client_v2_1.default(this);
    }
    /**
     * Get a client with read/write rights.
     */
    get readWrite() {
        return this;
    }
    /* Static helpers */
    static getErrors(error) {
        var _a;
        if (typeof error !== 'object')
            return [];
        if (!('data' in error))
            return [];
        return (_a = error.data.errors) !== null && _a !== void 0 ? _a : [];
    }
    /** Extract another image size than obtained in a `profile_image_url` or `profile_image_url_https` field of a user object. */
    static getProfileImageInSize(profileImageUrl, size) {
        const lastPart = profileImageUrl.split('/').pop();
        const sizes = ['normal', 'bigger', 'mini'];
        let originalUrl = profileImageUrl;
        for (const availableSize of sizes) {
            if (lastPart.includes(`_${availableSize}`)) {
                originalUrl = profileImageUrl.replace(`_${availableSize}`, '');
                break;
            }
        }
        if (size === 'original') {
            return originalUrl;
        }
        const extPos = originalUrl.lastIndexOf('.');
        if (extPos !== -1) {
            const ext = originalUrl.slice(extPos + 1);
            return originalUrl.slice(0, extPos) + '_' + size + '.' + ext;
        }
        else {
            return originalUrl + '_' + size;
        }
    }
}
exports.TwitterApi = TwitterApi;
var readwrite_2 = require("./readwrite");
Object.defineProperty(exports, "TwitterApiReadWrite", { enumerable: true, get: function () { return __importDefault(readwrite_2).default; } });
var readonly_1 = require("./readonly");
Object.defineProperty(exports, "TwitterApiReadOnly", { enumerable: true, get: function () { return __importDefault(readonly_1).default; } });
exports.default = TwitterApi;
