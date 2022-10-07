"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MuteUserIdsV1Paginator = exports.MuteUserListV1Paginator = void 0;
const paginator_v1_1 = require("./paginator.v1");
class MuteUserListV1Paginator extends paginator_v1_1.CursoredV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'mutes/users/list.json';
    }
    refreshInstanceFromResult(response, isNextPage) {
        const result = response.data;
        this._rateLimit = response.rateLimit;
        if (isNextPage) {
            this._realData.users.push(...result.users);
            this._realData.next_cursor = result.next_cursor;
        }
    }
    getPageLengthFromRequest(result) {
        return result.data.users.length;
    }
    getItemArray() {
        return this.users;
    }
    /**
     * Users returned by paginator.
     */
    get users() {
        return this._realData.users;
    }
}
exports.MuteUserListV1Paginator = MuteUserListV1Paginator;
class MuteUserIdsV1Paginator extends paginator_v1_1.CursoredV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'mutes/users/ids.json';
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
exports.MuteUserIdsV1Paginator = MuteUserIdsV1Paginator;
