"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("../globals");
const client_v2_read_1 = __importDefault(require("./client.v2.read"));
const client_v2_labs_write_1 = __importDefault(require("../v2-labs/client.v2.labs.write"));
/**
 * Base Twitter v2 client with read/write rights.
 */
class TwitterApiv2ReadWrite extends client_v2_read_1.default {
    constructor() {
        super(...arguments);
        this._prefix = globals_1.API_V2_PREFIX;
    }
    /* Sub-clients */
    /**
     * Get a client with only read rights.
     */
    get readOnly() {
        return this;
    }
    /**
     * Get a client for v2 labs endpoints.
     */
    get labs() {
        if (this._labs)
            return this._labs;
        return this._labs = new client_v2_labs_write_1.default(this);
    }
    /* Tweets */
    /**
     * Hides or unhides a reply to a Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/hide-replies/api-reference/put-tweets-id-hidden
     */
    hideReply(tweetId, makeHidden) {
        return this.put('tweets/:id/hidden', { hidden: makeHidden }, { params: { id: tweetId } });
    }
    /**
     * Causes the user ID identified in the path parameter to Like the target Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/post-users-user_id-likes
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    like(loggedUserId, targetTweetId) {
        return this.post('users/:id/likes', { tweet_id: targetTweetId }, { params: { id: loggedUserId } });
    }
    /**
     * Allows a user or authenticated user ID to unlike a Tweet.
     * The request succeeds with no action when the user sends a request to a user they're not liking the Tweet or have already unliked the Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/delete-users-id-likes-tweet_id
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unlike(loggedUserId, targetTweetId) {
        return this.delete('users/:id/likes/:tweet_id', undefined, {
            params: { id: loggedUserId, tweet_id: targetTweetId },
        });
    }
    /**
     * Causes the user ID identified in the path parameter to Retweet the target Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/post-users-id-retweets
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    retweet(loggedUserId, targetTweetId) {
        return this.post('users/:id/retweets', { tweet_id: targetTweetId }, { params: { id: loggedUserId } });
    }
    /**
     * Allows a user or authenticated user ID to remove the Retweet of a Tweet.
     * The request succeeds with no action when the user sends a request to a user they're not Retweeting the Tweet or have already removed the Retweet of.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/delete-users-id-retweets-tweet_id
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unretweet(loggedUserId, targetTweetId) {
        return this.delete('users/:id/retweets/:tweet_id', undefined, {
            params: { id: loggedUserId, tweet_id: targetTweetId },
        });
    }
    tweet(status, payload = {}) {
        if (typeof status === 'object') {
            payload = status;
        }
        else {
            payload = { text: status, ...payload };
        }
        return this.post('tweets', payload);
    }
    /**
     * Reply to a Tweet on behalf of an authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
     */
    reply(status, toTweetId, payload = {}) {
        var _a;
        const reply = { in_reply_to_tweet_id: toTweetId, ...(_a = payload.reply) !== null && _a !== void 0 ? _a : {} };
        return this.post('tweets', { text: status, ...payload, reply });
    }
    /**
     * Quote an existing Tweet on behalf of an authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
     */
    quote(status, quotedTweetId, payload = {}) {
        return this.tweet(status, { ...payload, quote_tweet_id: quotedTweetId });
    }
    /**
     * Post a series of tweets.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
     */
    async tweetThread(tweets) {
        var _a, _b;
        const postedTweets = [];
        for (const tweet of tweets) {
            // Retrieve the last sent tweet
            const lastTweet = postedTweets.length ? postedTweets[postedTweets.length - 1] : null;
            // Build the tweet query params
            const queryParams = { ...(typeof tweet === 'string' ? ({ text: tweet }) : tweet) };
            // Reply to an existing tweet if needed
            const inReplyToId = lastTweet ? lastTweet.data.id : (_a = queryParams.reply) === null || _a === void 0 ? void 0 : _a.in_reply_to_tweet_id;
            const status = (_b = queryParams.text) !== null && _b !== void 0 ? _b : '';
            if (inReplyToId) {
                postedTweets.push(await this.reply(status, inReplyToId, queryParams));
            }
            else {
                postedTweets.push(await this.tweet(status, queryParams));
            }
        }
        return postedTweets;
    }
    /**
     * Allows a user or authenticated user ID to delete a Tweet
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/delete-tweets-id
     */
    deleteTweet(tweetId) {
        return this.delete('tweets/:id', undefined, {
            params: {
                id: tweetId,
            },
        });
    }
    /* Bookmarks */
    /**
     * Causes the user ID of an authenticated user identified in the path parameter to Bookmark the target Tweet provided in the request body.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/api-reference/post-users-id-bookmarks
     *
     * OAuth2 scopes: `users.read` `tweet.read` `bookmark.write`
     */
    async bookmark(tweetId) {
        const user = await this.getCurrentUserV2Object();
        return this.post('users/:id/bookmarks', { tweet_id: tweetId }, { params: { id: user.data.id } });
    }
    /**
     * Allows a user or authenticated user ID to remove a Bookmark of a Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/api-reference/delete-users-id-bookmarks-tweet_id
     *
     * OAuth2 scopes: `users.read` `tweet.read` `bookmark.write`
     */
    async deleteBookmark(tweetId) {
        const user = await this.getCurrentUserV2Object();
        return this.delete('users/:id/bookmarks/:tweet_id', undefined, { params: { id: user.data.id, tweet_id: tweetId } });
    }
    /* Users */
    /**
     * Allows a user ID to follow another user.
     * If the target user does not have public Tweets, this endpoint will send a follow request.
     * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/post-users-source_user_id-following
     *
     * OAuth2 scope: `follows.write`
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    follow(loggedUserId, targetUserId) {
        return this.post('users/:id/following', { target_user_id: targetUserId }, { params: { id: loggedUserId } });
    }
    /**
     * Allows a user ID to unfollow another user.
     * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/delete-users-source_id-following
     *
     * OAuth2 scope: `follows.write`
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unfollow(loggedUserId, targetUserId) {
        return this.delete('users/:source_user_id/following/:target_user_id', undefined, {
            params: { source_user_id: loggedUserId, target_user_id: targetUserId },
        });
    }
    /**
     * Causes the user (in the path) to block the target user.
     * The user (in the path) must match the user context authorizing the request.
     * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/post-users-user_id-blocking
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    block(loggedUserId, targetUserId) {
        return this.post('users/:id/blocking', { target_user_id: targetUserId }, { params: { id: loggedUserId } });
    }
    /**
     * Allows a user or authenticated user ID to unblock another user.
     * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/delete-users-user_id-blocking
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unblock(loggedUserId, targetUserId) {
        return this.delete('users/:source_user_id/blocking/:target_user_id', undefined, {
            params: { source_user_id: loggedUserId, target_user_id: targetUserId },
        });
    }
    /**
     * Allows an authenticated user ID to mute the target user.
     * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/post-users-user_id-muting
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    mute(loggedUserId, targetUserId) {
        return this.post('users/:id/muting', { target_user_id: targetUserId }, { params: { id: loggedUserId } });
    }
    /**
     * Allows an authenticated user ID to unmute the target user.
     * The request succeeds with no action when the user sends a request to a user they're not muting or have already unmuted.
     * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/delete-users-user_id-muting
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unmute(loggedUserId, targetUserId) {
        return this.delete('users/:source_user_id/muting/:target_user_id', undefined, {
            params: { source_user_id: loggedUserId, target_user_id: targetUserId },
        });
    }
    /* Lists */
    /**
     * Creates a new list for the authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-lists
     */
    createList(options) {
        return this.post('lists', options);
    }
    /**
     * Updates the specified list. The authenticated user must own the list to be able to update it.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/put-lists-id
     */
    updateList(listId, options = {}) {
        return this.put('lists/:id', options, { params: { id: listId } });
    }
    /**
     * Deletes the specified list. The authenticated user must own the list to be able to destroy it.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-lists-id
     */
    removeList(listId) {
        return this.delete('lists/:id', undefined, { params: { id: listId } });
    }
    /**
     * Adds a member to a list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-lists-id-members
     */
    addListMember(listId, userId) {
        return this.post('lists/:id/members', { user_id: userId }, { params: { id: listId } });
    }
    /**
     * Remember a member to a list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-lists-id-members-user_id
     */
    removeListMember(listId, userId) {
        return this.delete('lists/:id/members/:user_id', undefined, { params: { id: listId, user_id: userId } });
    }
    /**
     * Subscribes the authenticated user to the specified list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-users-id-followed-lists
     */
    subscribeToList(loggedUserId, listId) {
        return this.post('users/:id/followed_lists', { list_id: listId }, { params: { id: loggedUserId } });
    }
    /**
     * Unsubscribes the authenticated user to the specified list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-users-id-followed-lists-list_id
     */
    unsubscribeOfList(loggedUserId, listId) {
        return this.delete('users/:id/followed_lists/:list_id', undefined, { params: { id: loggedUserId, list_id: listId } });
    }
    /**
     * Enables the authenticated user to pin a List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-users-id-pinned-lists
     */
    pinList(loggedUserId, listId) {
        return this.post('users/:id/pinned_lists', { list_id: listId }, { params: { id: loggedUserId } });
    }
    /**
     * Enables the authenticated user to unpin a List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-users-id-pinned-lists-list_id
     */
    unpinList(loggedUserId, listId) {
        return this.delete('users/:id/pinned_lists/:list_id', undefined, { params: { id: loggedUserId, list_id: listId } });
    }
}
exports.default = TwitterApiv2ReadWrite;
