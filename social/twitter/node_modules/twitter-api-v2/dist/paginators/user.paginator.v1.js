"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipsOutgoingV1Paginator = exports.FriendshipsIncomingV1Paginator = exports.UserSearchV1Paginator = void 0;
const TwitterPaginator_1 = __importDefault(require("./TwitterPaginator"));
const paginator_v1_1 = require("./paginator.v1");
/** A generic TwitterPaginator able to consume TweetV1 timelines. */
class UserSearchV1Paginator extends TwitterPaginator_1.default {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/search.json';
    }
    refreshInstanceFromResult(response, isNextPage) {
        const result = response.data;
        this._rateLimit = response.rateLimit;
        if (isNextPage) {
            this._realData.push(...result);
        }
    }
    getNextQueryParams(maxResults) {
        var _a;
        const previousPage = Number((_a = this._queryParams.page) !== null && _a !== void 0 ? _a : '1');
        return {
            ...this._queryParams,
            page: previousPage + 1,
            ...maxResults ? { count: maxResults } : {},
        };
    }
    getPageLengthFromRequest(result) {
        return result.data.length;
    }
    isFetchLastOver(result) {
        return !result.data.length;
    }
    canFetchNextPage(result) {
        return result.length > 0;
    }
    getItemArray() {
        return this.users;
    }
    /**
     * Users returned by paginator.
     */
    get users() {
        return this._realData;
    }
}
exports.UserSearchV1Paginator = UserSearchV1Paginator;
class FriendshipsIncomingV1Paginator extends paginator_v1_1.CursoredV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'friendships/incoming.json';
        this._maxResultsWhenFetchLast = 5000;
    }
    refreshInstanceFromResult(response, isNextPage) {
        const result = response.data;
        this._rateLimit = response.rateLimit;
        if (isNextPage) {
            this._realData.ids.push(...result.ids);
            this._realData.next_cursor = result.next_cursor;
        }
    }
    getPageLengthFromRequest(result) {
        return result.data.ids.length;
    }
    getItemArray() {
        return this.ids;
    }
    /**
     * Users IDs returned by paginator.
     */
    get ids() {
        return this._realData.ids;
    }
}
exports.FriendshipsIncomingV1Paginator = FriendshipsIncomingV1Paginator;
class FriendshipsOutgoingV1Paginator extends FriendshipsIncomingV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'friendships/outgoing.json';
    }
}
exports.FriendshipsOutgoingV1Paginator = FriendshipsOutgoingV1Paginator;
