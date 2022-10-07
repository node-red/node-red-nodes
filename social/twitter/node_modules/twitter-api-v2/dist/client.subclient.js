"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_base_1 = __importDefault(require("./client.base"));
/**
 * Base subclient for every v1 and v2 client.
 */
class TwitterApiSubClient extends client_base_1.default {
    constructor(instance) {
        if (!(instance instanceof client_base_1.default)) {
            throw new Error('You must instance SubTwitterApi instance from existing TwitterApi instance.');
        }
        super(instance);
    }
}
exports.default = TwitterApiSubClient;
