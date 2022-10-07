"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursoredV1Paginator = void 0;
const TwitterPaginator_1 = __importDefault(require("./TwitterPaginator"));
class CursoredV1Paginator extends TwitterPaginator_1.default {
    getNextQueryParams(maxResults) {
        var _a;
        return {
            ...this._queryParams,
            cursor: (_a = this._realData.next_cursor_str) !== null && _a !== void 0 ? _a : this._realData.next_cursor,
            ...(maxResults ? { count: maxResults } : {}),
        };
    }
    isFetchLastOver(result) {
        // If we cant fetch next page
        return !this.canFetchNextPage(result.data);
    }
    canFetchNextPage(result) {
        // If one of cursor is valid
        return !this.isNextCursorInvalid(result.next_cursor) || !this.isNextCursorInvalid(result.next_cursor_str);
    }
    isNextCursorInvalid(value) {
        return value === undefined
            || value === 0
            || value === -1
            || value === '0'
            || value === '-1';
    }
}
exports.CursoredV1Paginator = CursoredV1Paginator;
