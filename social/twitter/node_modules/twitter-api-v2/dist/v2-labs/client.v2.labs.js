"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterApiv2Labs = void 0;
const globals_1 = require("../globals");
const client_v2_labs_write_1 = __importDefault(require("./client.v2.labs.write"));
/**
 * Twitter v2 labs client with all rights (read/write/DMs)
 */
class TwitterApiv2Labs extends client_v2_labs_write_1.default {
    constructor() {
        super(...arguments);
        this._prefix = globals_1.API_V2_LABS_PREFIX;
    }
    /**
     * Get a client with read/write rights.
     */
    get readWrite() {
        return this;
    }
}
exports.TwitterApiv2Labs = TwitterApiv2Labs;
exports.default = TwitterApiv2Labs;
