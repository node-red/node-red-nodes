"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("../globals");
const client_v2_labs_read_1 = __importDefault(require("./client.v2.labs.read"));
/**
 * Base Twitter v2 labs client with read/write rights.
 */
class TwitterApiv2LabsReadWrite extends client_v2_labs_read_1.default {
    constructor() {
        super(...arguments);
        this._prefix = globals_1.API_V2_LABS_PREFIX;
    }
    /**
     * Get a client with only read rights.
     */
    get readOnly() {
        return this;
    }
}
exports.default = TwitterApiv2LabsReadWrite;
