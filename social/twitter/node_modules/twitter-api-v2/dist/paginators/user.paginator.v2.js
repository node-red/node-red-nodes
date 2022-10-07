"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweetRetweetersUsersV2Paginator = exports.TweetLikingUsersV2Paginator = exports.UserListFollowersV2Paginator = exports.UserListMembersV2Paginator = exports.UserFollowingV2Paginator = exports.UserFollowersV2Paginator = exports.UserMutingUsersV2Paginator = exports.UserBlockingUsersV2Paginator = void 0;
const v2_paginator_1 = require("./v2.paginator");
/** A generic PreviousableTwitterPaginator able to consume UserV2 timelines. */
class UserTimelineV2Paginator extends v2_paginator_1.TimelineV2Paginator {
    getItemArray() {
        return this.users;
    }
    /**
     * Users returned by paginator.
     */
    get users() {
        var _a;
        return (_a = this._realData.data) !== null && _a !== void 0 ? _a : [];
    }
    get meta() {
        return super.meta;
    }
}
class UserBlockingUsersV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/:id/blocking';
    }
}
exports.UserBlockingUsersV2Paginator = UserBlockingUsersV2Paginator;
class UserMutingUsersV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/:id/muting';
    }
}
exports.UserMutingUsersV2Paginator = UserMutingUsersV2Paginator;
class UserFollowersV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/:id/followers';
    }
}
exports.UserFollowersV2Paginator = UserFollowersV2Paginator;
class UserFollowingV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'users/:id/following';
    }
}
exports.UserFollowingV2Paginator = UserFollowingV2Paginator;
class UserListMembersV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/:id/members';
    }
}
exports.UserListMembersV2Paginator = UserListMembersV2Paginator;
class UserListFollowersV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/:id/followers';
    }
}
exports.UserListFollowersV2Paginator = UserListFollowersV2Paginator;
class TweetLikingUsersV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'tweets/:id/liking_users';
    }
}
exports.TweetLikingUsersV2Paginator = TweetLikingUsersV2Paginator;
class TweetRetweetersUsersV2Paginator extends UserTimelineV2Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'tweets/:id/retweeted_by';
    }
}
exports.TweetRetweetersUsersV2Paginator = TweetRetweetersUsersV2Paginator;
