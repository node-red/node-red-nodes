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
exports.OAuth2Helper = void 0;
const crypto = __importStar(require("crypto"));
class OAuth2Helper {
    static getCodeVerifier() {
        return this.generateRandomString(128);
    }
    static getCodeChallengeFromVerifier(verifier) {
        return this.escapeBase64Url(crypto
            .createHash('sha256')
            .update(verifier)
            .digest('base64'));
    }
    static getAuthHeader(clientId, clientSecret) {
        const key = encodeURIComponent(clientId) + ':' + encodeURIComponent(clientSecret);
        return Buffer.from(key).toString('base64');
    }
    static generateRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        for (let i = 0; i < length; i++) {
            text += possible[Math.floor(Math.random() * possible.length)];
        }
        return text;
    }
    static escapeBase64Url(string) {
        return string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
}
exports.OAuth2Helper = OAuth2Helper;
