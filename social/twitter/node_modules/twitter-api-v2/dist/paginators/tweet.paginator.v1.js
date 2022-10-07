"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFavoritesV1Paginator = exports.ListTimelineV1Paginator = exports.UserTimelineV1Paginator = exports.MentionTimelineV1Paginator = exports.HomeTimelineV1Paginator = void 0;
const TwitterPaginator_1 = __importDefault(require("./TwitterPaginator"));
/** A generic TwitterPaginator able to consume TweetV1 timelines. */
class TweetTimelineV1Paginator extends TwitterPaginator_1.default {
    constructor() {
        super(...arguments);
        this.hasFinishedFetch = false;
    }
    refreshInstanceFromResult(response, isNextPage) {
        const result = response.data;
        this._rateLimit = response.rateLimit;
        if (isNextPage) {
            this._realData.push(...result);
            // HINT: This is an approximation, as "end" of pagination cannot be safely determined without cursors.
            this.hasFinishedFetch = result.length === 0;
        }
    }
    getNextQueryParams(maxResults) {
        const lastestId = BigInt(this._realData[this._realData.length - 1].id_str);
        return {
            ...this.injectQueryParams(maxResults),
            max_id: (lastestId - BigInt(1)).toString(),
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
        return this.tweets;
    }
    /**
     * Tweets returned by paginator.
     */
    get tweets() {
        return this._realData;
    }
    get done() {
        return super.done || this.hasFinishedFetch;
    }
}
// Timelines
// Home
class HomeTimelineV1Paginator extends TweetTimelineV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'statuses/home_timeline.json';
    }
}
exports.HomeTimelineV1Paginator = HomeTimelineV1Paginator;
// Mention
class MentionTimelineV1Paginator extends TweetTimelineV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'statuses/mentions_timeline.json';
    }
}
exports.MentionTimelineV1Paginator = MentionTimelineV1Paginator;
// User
class UserTimelineV1Paginator extends TweetTimelineV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'statuses/user_timeline.json';
    }
}
exports.UserTimelineV1Paginator = UserTimelineV1Paginator;
// Lists
class ListTimelineV1Paginator extends TweetTimelineV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'lists/statuses.json';
    }
}
exports.ListTimelineV1Paginator = ListTimelineV1Paginator;
// Favorites
class UserFavoritesV1Paginator extends TweetTimelineV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'favorites/list.json';
    }
}
exports.UserFavoritesV1Paginator = UserFavoritesV1Paginator;
