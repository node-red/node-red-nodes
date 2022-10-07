"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterV2IncludesHelper = void 0;
/**
 * Provide helpers for `.includes` of a v2 API result.
 * Needed expansions for a method to work are specified (*`like this`*).
 */
class TwitterV2IncludesHelper {
    constructor(result) {
        this.result = result;
    }
    /* Tweets */
    get tweets() {
        return TwitterV2IncludesHelper.tweets(this.result);
    }
    static tweets(result) {
        var _a, _b;
        return (_b = (_a = result.includes) === null || _a === void 0 ? void 0 : _a.tweets) !== null && _b !== void 0 ? _b : [];
    }
    tweetById(id) {
        return TwitterV2IncludesHelper.tweetById(this.result, id);
    }
    static tweetById(result, id) {
        return this.tweets(result).find(tweet => tweet.id === id);
    }
    /** Retweet associated with the given tweet (*`referenced_tweets.id`*) */
    retweet(tweet) {
        return TwitterV2IncludesHelper.retweet(this.result, tweet);
    }
    /** Retweet associated with the given tweet (*`referenced_tweets.id`*) */
    static retweet(result, tweet) {
        var _a;
        const retweetIds = ((_a = tweet.referenced_tweets) !== null && _a !== void 0 ? _a : [])
            .filter(ref => ref.type === 'retweeted')
            .map(ref => ref.id);
        return this.tweets(result).find(t => retweetIds.includes(t.id));
    }
    /** Quoted tweet associated with the given tweet (*`referenced_tweets.id`*) */
    quote(tweet) {
        return TwitterV2IncludesHelper.quote(this.result, tweet);
    }
    /** Quoted tweet associated with the given tweet (*`referenced_tweets.id`*) */
    static quote(result, tweet) {
        var _a;
        const quoteIds = ((_a = tweet.referenced_tweets) !== null && _a !== void 0 ? _a : [])
            .filter(ref => ref.type === 'quoted')
            .map(ref => ref.id);
        return this.tweets(result).find(t => quoteIds.includes(t.id));
    }
    /** Tweet whose has been answered by the given tweet (*`referenced_tweets.id`*) */
    repliedTo(tweet) {
        return TwitterV2IncludesHelper.repliedTo(this.result, tweet);
    }
    /** Tweet whose has been answered by the given tweet (*`referenced_tweets.id`*) */
    static repliedTo(result, tweet) {
        var _a;
        const repliesIds = ((_a = tweet.referenced_tweets) !== null && _a !== void 0 ? _a : [])
            .filter(ref => ref.type === 'replied_to')
            .map(ref => ref.id);
        return this.tweets(result).find(t => repliesIds.includes(t.id));
    }
    /** Tweet author user object of the given tweet (*`author_id`* or *`referenced_tweets.id.author_id`*) */
    author(tweet) {
        return TwitterV2IncludesHelper.author(this.result, tweet);
    }
    /** Tweet author user object of the given tweet (*`author_id`* or *`referenced_tweets.id.author_id`*) */
    static author(result, tweet) {
        const authorId = tweet.author_id;
        return authorId ? this.users(result).find(u => u.id === authorId) : undefined;
    }
    /** Tweet author user object of the tweet answered by the given tweet (*`in_reply_to_user_id`*) */
    repliedToAuthor(tweet) {
        return TwitterV2IncludesHelper.repliedToAuthor(this.result, tweet);
    }
    /** Tweet author user object of the tweet answered by the given tweet (*`in_reply_to_user_id`*) */
    static repliedToAuthor(result, tweet) {
        const inReplyUserId = tweet.in_reply_to_user_id;
        return inReplyUserId ? this.users(result).find(u => u.id === inReplyUserId) : undefined;
    }
    /* Users */
    get users() {
        return TwitterV2IncludesHelper.users(this.result);
    }
    static users(result) {
        var _a, _b;
        return (_b = (_a = result.includes) === null || _a === void 0 ? void 0 : _a.users) !== null && _b !== void 0 ? _b : [];
    }
    userById(id) {
        return TwitterV2IncludesHelper.userById(this.result, id);
    }
    static userById(result, id) {
        return this.users(result).find(u => u.id === id);
    }
    /** Pinned tweet of the given user (*`pinned_tweet_id`*) */
    pinnedTweet(user) {
        return TwitterV2IncludesHelper.pinnedTweet(this.result, user);
    }
    /** Pinned tweet of the given user (*`pinned_tweet_id`*) */
    static pinnedTweet(result, user) {
        return user.pinned_tweet_id ? this.tweets(result).find(t => t.id === user.pinned_tweet_id) : undefined;
    }
    /* Medias */
    get media() {
        return TwitterV2IncludesHelper.media(this.result);
    }
    static media(result) {
        var _a, _b;
        return (_b = (_a = result.includes) === null || _a === void 0 ? void 0 : _a.media) !== null && _b !== void 0 ? _b : [];
    }
    /** Medias associated with the given tweet (*`attachments.media_keys`*) */
    medias(tweet) {
        return TwitterV2IncludesHelper.medias(this.result, tweet);
    }
    /** Medias associated with the given tweet (*`attachments.media_keys`*) */
    static medias(result, tweet) {
        var _a, _b;
        const keys = (_b = (_a = tweet.attachments) === null || _a === void 0 ? void 0 : _a.media_keys) !== null && _b !== void 0 ? _b : [];
        return this.media(result).filter(m => keys.includes(m.media_key));
    }
    /* Polls */
    get polls() {
        return TwitterV2IncludesHelper.polls(this.result);
    }
    static polls(result) {
        var _a, _b;
        return (_b = (_a = result.includes) === null || _a === void 0 ? void 0 : _a.polls) !== null && _b !== void 0 ? _b : [];
    }
    /** Poll associated with the given tweet (*`attachments.poll_ids`*) */
    poll(tweet) {
        return TwitterV2IncludesHelper.poll(this.result, tweet);
    }
    /** Poll associated with the given tweet (*`attachments.poll_ids`*) */
    static poll(result, tweet) {
        var _a, _b;
        const pollIds = (_b = (_a = tweet.attachments) === null || _a === void 0 ? void 0 : _a.poll_ids) !== null && _b !== void 0 ? _b : [];
        if (pollIds.length) {
            const pollId = pollIds[0];
            return this.polls(result).find(p => p.id === pollId);
        }
        return undefined;
    }
    /* Places */
    get places() {
        return TwitterV2IncludesHelper.places(this.result);
    }
    static places(result) {
        var _a, _b;
        return (_b = (_a = result.includes) === null || _a === void 0 ? void 0 : _a.places) !== null && _b !== void 0 ? _b : [];
    }
    /** Place associated with the given tweet (*`geo.place_id`*) */
    place(tweet) {
        return TwitterV2IncludesHelper.place(this.result, tweet);
    }
    /** Place associated with the given tweet (*`geo.place_id`*) */
    static place(result, tweet) {
        var _a;
        const placeId = (_a = tweet.geo) === null || _a === void 0 ? void 0 : _a.place_id;
        return placeId ? this.places(result).find(p => p.id === placeId) : undefined;
    }
    /* Lists */
    /** List owner of the given list (*`owner_id`*) */
    listOwner(list) {
        return TwitterV2IncludesHelper.listOwner(this.result, list);
    }
    /** List owner of the given list (*`owner_id`*) */
    static listOwner(result, list) {
        const creatorId = list.owner_id;
        return creatorId ? this.users(result).find(p => p.id === creatorId) : undefined;
    }
    /* Spaces */
    /** Creator of the given space (*`creator_id`*) */
    spaceCreator(space) {
        return TwitterV2IncludesHelper.spaceCreator(this.result, space);
    }
    /** Creator of the given space (*`creator_id`*) */
    static spaceCreator(result, space) {
        const creatorId = space.creator_id;
        return creatorId ? this.users(result).find(p => p.id === creatorId) : undefined;
    }
    /** Current hosts of the given space (*`host_ids`*) */
    spaceHosts(space) {
        return TwitterV2IncludesHelper.spaceHosts(this.result, space);
    }
    /** Current hosts of the given space (*`host_ids`*) */
    static spaceHosts(result, space) {
        var _a;
        const hostIds = (_a = space.host_ids) !== null && _a !== void 0 ? _a : [];
        return this.users(result).filter(u => hostIds.includes(u.id));
    }
    /** Current speakers of the given space (*`speaker_ids`*) */
    spaceSpeakers(space) {
        return TwitterV2IncludesHelper.spaceSpeakers(this.result, space);
    }
    /** Current speakers of the given space (*`speaker_ids`*) */
    static spaceSpeakers(result, space) {
        var _a;
        const speakerIds = (_a = space.speaker_ids) !== null && _a !== void 0 ? _a : [];
        return this.users(result).filter(u => speakerIds.includes(u.id));
    }
    /** Current invited users of the given space (*`invited_user_ids`*) */
    spaceInvitedUsers(space) {
        return TwitterV2IncludesHelper.spaceInvitedUsers(this.result, space);
    }
    /** Current invited users of the given space (*`invited_user_ids`*) */
    static spaceInvitedUsers(result, space) {
        var _a;
        const invitedUserIds = (_a = space.invited_user_ids) !== null && _a !== void 0 ? _a : [];
        return this.users(result).filter(u => invitedUserIds.includes(u.id));
    }
}
exports.TwitterV2IncludesHelper = TwitterV2IncludesHelper;
