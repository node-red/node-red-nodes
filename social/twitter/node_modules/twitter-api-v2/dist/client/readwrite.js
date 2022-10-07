"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_v1_write_1 = __importDefault(require("../v1/client.v1.write"));
const client_v2_write_1 = __importDefault(require("../v2/client.v2.write"));
const readonly_1 = __importDefault(require("./readonly"));
/**
 * Twitter v1.1 and v2 API client.
 */
class TwitterApiReadWrite extends readonly_1.default {
    /* Direct access to subclients */
    get v1() {
        if (this._v1)
            return this._v1;
        return this._v1 = new client_v1_write_1.default(this);
    }
    get v2() {
        if (this._v2)
            return this._v2;
        return this._v2 = new client_v2_write_1.default(this);
    }
    /**
     * Get a client with read only rights.
     */
    get readOnly() {
        return this;
    }
}
exports.default = TwitterApiReadWrite;
