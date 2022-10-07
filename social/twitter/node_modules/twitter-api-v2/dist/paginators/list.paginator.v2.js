"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserListFollowedV2Paginator = exports.UserListMembershipsV2Paginator = exports.UserOwnedListsV2Paginator = void 0;
const v2_paginator_1 = require("./v2.paginator");
class ListTimelineV2Paginator extends v2_paginator_1.TimelineV2Paginator {
    getItemArray() {
        return this.lists;
    }
    /**
     * Lists returned by paginator.
     */
    get lists() {
        var _a;
        return (_a = this._realData.data) !== null && _a !== void 0 ? _a : [];
    }
    get meta() {
        return super.meta;
    }
}
class UserOwnedListsV2Paginator extends ListTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/:id/owned_lists';
    }
}
exports.UserOwnedListsV2Paginator = UserOwnedListsV2Paginator;
class UserListMembershipsV2Paginator extends ListTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/:id/list_memberships';
    }
}
exports.UserListMembershipsV2Paginator = UserListMembershipsV2Paginator;
class UserListFollowedV2Paginator extends ListTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/:id/followed_lists';
    }
}
exports.UserListFollowedV2Paginator = UserListFollowedV2Paginator;
