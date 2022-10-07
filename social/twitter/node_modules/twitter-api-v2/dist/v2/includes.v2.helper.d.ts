import type { ApiV2Includes, ListV2, SpaceV2, TweetV2, UserV2 } from '../types';
export declare type TTwitterV2IncludesResult = {
    includes?: ApiV2Includes;
};
/**
 * Provide helpers for `.includes` of a v2 API result.
 * Needed expansions for a method to work are specified (*`like this`*).
 */
export declare class TwitterV2IncludesHelper implements ApiV2Includes {
    protected result: TTwitterV2IncludesResult;
    constructor(result: TTwitterV2IncludesResult);
    get tweets(): TweetV2[];
    static tweets(result: TTwitterV2IncludesResult): TweetV2[];
    tweetById(id: string): TweetV2 | undefined;
    static tweetById(result: TTwitterV2IncludesResult, id: string): TweetV2 | undefined;
    /** Retweet associated with the given tweet (*`referenced_tweets.id`*) */
    retweet(tweet: TweetV2): TweetV2 | undefined;
    /** Retweet associated with the given tweet (*`referenced_tweets.id`*) */
    static retweet(result: TTwitterV2IncludesResult, tweet: TweetV2): TweetV2 | undefined;
    /** Quoted tweet associated with the given tweet (*`referenced_tweets.id`*) */
    quote(tweet: TweetV2): TweetV2 | undefined;
    /** Quoted tweet associated with the given tweet (*`referenced_tweets.id`*) */
    static quote(result: TTwitterV2IncludesResult, tweet: TweetV2): TweetV2 | undefined;
    /** Tweet whose has been answered by the given tweet (*`referenced_tweets.id`*) */
    repliedTo(tweet: TweetV2): TweetV2 | undefined;
    /** Tweet whose has been answered by the given tweet (*`referenced_tweets.id`*) */
    static repliedTo(result: TTwitterV2IncludesResult, tweet: TweetV2): TweetV2 | undefined;
    /** Tweet author user object of the given tweet (*`author_id`* or *`referenced_tweets.id.author_id`*) */
    author(tweet: TweetV2): UserV2 | undefined;
    /** Tweet author user object of the given tweet (*`author_id`* or *`referenced_tweets.id.author_id`*) */
    static author(result: TTwitterV2IncludesResult, tweet: TweetV2): UserV2 | undefined;
    /** Tweet author user object of the tweet answered by the given tweet (*`in_reply_to_user_id`*) */
    repliedToAuthor(tweet: TweetV2): UserV2 | undefined;
    /** Tweet author user object of the tweet answered by the given tweet (*`in_reply_to_user_id`*) */
    static repliedToAuthor(result: TTwitterV2IncludesResult, tweet: TweetV2): UserV2 | undefined;
    get users(): UserV2[];
    static users(result: TTwitterV2IncludesResult): UserV2[];
    userById(id: string): UserV2 | undefined;
    static userById(result: TTwitterV2IncludesResult, id: string): UserV2 | undefined;
    /** Pinned tweet of the given user (*`pinned_tweet_id`*) */
    pinnedTweet(user: UserV2): TweetV2 | undefined;
    /** Pinned tweet of the given user (*`pinned_tweet_id`*) */
    static pinnedTweet(result: TTwitterV2IncludesResult, user: UserV2): TweetV2 | undefined;
    get media(): import("../types").MediaObjectV2[];
    static media(result: TTwitterV2IncludesResult): import("../types").MediaObjectV2[];
    /** Medias associated with the given tweet (*`attachments.media_keys`*) */
    medias(tweet: TweetV2): import("../types").MediaObjectV2[];
    /** Medias associated with the given tweet (*`attachments.media_keys`*) */
    static medias(result: TTwitterV2IncludesResult, tweet: TweetV2): import("../types").MediaObjectV2[];
    get polls(): import("../types").PollV2[];
    static polls(result: TTwitterV2IncludesResult): import("../types").PollV2[];
    /** Poll associated with the given tweet (*`attachments.poll_ids`*) */
    poll(tweet: TweetV2): import("../types").PollV2 | undefined;
    /** Poll associated with the given tweet (*`attachments.poll_ids`*) */
    static poll(result: TTwitterV2IncludesResult, tweet: TweetV2): import("../types").PollV2 | undefined;
    get places(): import("../types").PlaceV2[];
    static places(result: TTwitterV2IncludesResult): import("../types").PlaceV2[];
    /** Place associated with the given tweet (*`geo.place_id`*) */
    place(tweet: TweetV2): import("../types").PlaceV2 | undefined;
    /** Place associated with the given tweet (*`geo.place_id`*) */
    static place(result: TTwitterV2IncludesResult, tweet: TweetV2): import("../types").PlaceV2 | undefined;
    /** List owner of the given list (*`owner_id`*) */
    listOwner(list: ListV2): UserV2 | undefined;
    /** List owner of the given list (*`owner_id`*) */
    static listOwner(result: TTwitterV2IncludesResult, list: ListV2): UserV2 | undefined;
    /** Creator of the given space (*`creator_id`*) */
    spaceCreator(space: SpaceV2): UserV2 | undefined;
    /** Creator of the given space (*`creator_id`*) */
    static spaceCreator(result: TTwitterV2IncludesResult, space: SpaceV2): UserV2 | undefined;
    /** Current hosts of the given space (*`host_ids`*) */
    spaceHosts(space: SpaceV2): UserV2[];
    /** Current hosts of the given space (*`host_ids`*) */
    static spaceHosts(result: TTwitterV2IncludesResult, space: SpaceV2): UserV2[];
    /** Current speakers of the given space (*`speaker_ids`*) */
    spaceSpeakers(space: SpaceV2): UserV2[];
    /** Current speakers of the given space (*`speaker_ids`*) */
    static spaceSpeakers(result: TTwitterV2IncludesResult, space: SpaceV2): UserV2[];
    /** Current invited users of the given space (*`invited_user_ids`*) */
    spaceInvitedUsers(space: SpaceV2): UserV2[];
    /** Current invited users of the given space (*`invited_user_ids`*) */
    static spaceInvitedUsers(result: TTwitterV2IncludesResult, space: SpaceV2): UserV2[];
}
