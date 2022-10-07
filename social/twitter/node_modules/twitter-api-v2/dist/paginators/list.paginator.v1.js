"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSubscribersV1Paginator = exports.ListMembersV1Paginator = exports.ListSubscriptionsV1Paginator = exports.ListOwnershipsV1Paginator = exports.ListMembershipsV1Paginator = void 0;
const paginator_v1_1 = require("./paginator.v1");
class ListListsV1Paginator extends paginator_v1_1.CursoredV1Paginator {
    refreshInstanceFromResult(response, isNextPage) {
        const result = response.data;
        this._rateLimit = response.rateLimit;
        if (isNextPage) {
            this._realData.lists.push(...result.lists);
            this._realData.next_cursor = result.next_cursor;
        }
    }
    getPageLengthFromRequest(result) {
        return result.data.lists.length;
    }
    getItemArray() {
        return this.lists;
    }
    /**
     * Lists returned by paginator.
     */
    get lists() {
        return this._realData.lists;
    }
}
class ListMembershipsV1Paginator extends ListListsV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/memberships.json';
    }
}
exports.ListMembershipsV1Paginator = ListMembershipsV1Paginator;
class ListOwnershipsV1Paginator extends ListListsV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/ownerships.json';
    }
}
exports.ListOwnershipsV1Paginator = ListOwnershipsV1Paginator;
class ListSubscriptionsV1Paginator extends ListListsV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/subscriptions.json';
    }
}
exports.ListSubscriptionsV1Paginator = ListSubscriptionsV1Paginator;
class ListUsersV1Paginator extends paginator_v1_1.CursoredV1Paginator {
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
class ListMembersV1Paginator extends ListUsersV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/members.json';
    }
}
exports.ListMembersV1Paginator = ListMembersV1Paginator;
class ListSubscribersV1Paginator extends ListUsersV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/subscribers.json';
    }
}
exports.ListSubscribersV1Paginator = ListSubscribersV1Paginator;
