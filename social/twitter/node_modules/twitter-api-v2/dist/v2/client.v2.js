"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterApiv2 = void 0;
const globals_1 = require("../globals");
const client_v2_write_1 = __importDefault(require("./client.v2.write"));
const client_v2_labs_1 = __importDefault(require("../v2-labs/client.v2.labs"));
/**
 * Twitter v2 client with all rights (read/write/DMs)
 */
class TwitterApiv2 extends client_v2_write_1.default {
    constructor() {
        super(...arguments);
        this._prefix = globals_1.API_V2_PREFIX;
    }
    /* Sub-clients */
    /**
     * Get a client with read/write rights.
     */
    get readWrite() {
        return this;
    }
    /**
     * Get a client for v2 labs endpoints.
     */
    get labs() {
        if (this._labs)
            return this._labs;
        return this._labs = new client_v2_labs_1.default(this);
    }
}
exports.TwitterApiv2 = TwitterApiv2;
exports.default = TwitterApiv2;
