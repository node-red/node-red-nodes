"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormDataHelper = void 0;
const helpers_1 = require("../helpers");
// This class is partially inspired by https://github.com/form-data/form-data/blob/master/lib/form_data.js
// All credits to their authors.
class FormDataHelper {
    constructor() {
        this._boundary = '';
        this._chunks = [];
    }
    bodyAppend(...values) {
        const allAsBuffer = values.map(val => val instanceof Buffer ? val : Buffer.from(val));
        this._chunks.push(...allAsBuffer);
    }
    append(field, value, contentType) {
        const convertedValue = value instanceof Buffer ? value : value.toString();
        const header = this.getMultipartHeader(field, convertedValue, contentType);
        this.bodyAppend(header, convertedValue, FormDataHelper.LINE_BREAK);
    }
    getHeaders() {
        return {
            'content-type': 'multipart/form-data; boundary=' + this.getBoundary(),
        };
    }
    /** Length of form-data (including footer length). */
    getLength() {
        return this._chunks.reduce((acc, cur) => acc + cur.length, this.getMultipartFooter().length);
    }
    getBuffer() {
        const allChunks = [...this._chunks, this.getMultipartFooter()];
        const totalBuffer = Buffer.alloc(this.getLength());
        let i = 0;
        for (const chunk of allChunks) {
            for (let j = 0; j < chunk.length; i++, j++) {
                totalBuffer[i] = chunk[j];
            }
        }
        return totalBuffer;
    }
    getBoundary() {
        if (!this._boundary) {
            this.generateBoundary();
        }
        return this._boundary;
    }
    generateBoundary() {
        // This generates a 50 character boundary similar to those used by Firefox.
        let boundary = '--------------------------';
        for (let i = 0; i < 24; i++) {
            boundary += Math.floor(Math.random() * 10).toString(16);
        }
        this._boundary = boundary;
    }
    getMultipartHeader(field, value, contentType) {
        // In this lib no need to guess more the content type, octet stream is ok of buffers
        if (!contentType) {
            contentType = value instanceof Buffer ? FormDataHelper.DEFAULT_CONTENT_TYPE : '';
        }
        const headers = {
            'Content-Disposition': ['form-data', `name="${field}"`],
            'Content-Type': contentType,
        };
        let contents = '';
        for (const [prop, header] of Object.entries(headers)) {
            // skip nullish headers.
            if (!header.length) {
                continue;
            }
            contents += prop + ': ' + (0, helpers_1.arrayWrap)(header).join('; ') + FormDataHelper.LINE_BREAK;
        }
        return '--' + this.getBoundary() + FormDataHelper.LINE_BREAK + contents + FormDataHelper.LINE_BREAK;
    }
    getMultipartFooter() {
        if (this._footerChunk) {
            return this._footerChunk;
        }
        return this._footerChunk = Buffer.from('--' + this.getBoundary() + '--' + FormDataHelper.LINE_BREAK);
    }
}
exports.FormDataHelper = FormDataHelper;
FormDataHelper.LINE_BREAK = '\r\n';
FormDataHelper.DEFAULT_CONTENT_TYPE = 'application/octet-stream';
