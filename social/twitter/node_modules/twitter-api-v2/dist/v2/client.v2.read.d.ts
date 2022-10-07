import TwitterApiSubClient from '../client.subclient';
import { Tweetv2FieldsParams, Tweetv2SearchParams, UserV2Result, UsersV2Result, UsersV2Params, StreamingV2GetRulesParams, StreamingV2GetRulesResult, TweetV2LookupResult, TweetV2UserTimelineParams, StreamingV2AddRulesParams, StreamingV2DeleteRulesParams, StreamingV2UpdateRulesQuery, StreamingV2UpdateRulesDeleteResult, StreamingV2UpdateRulesAddResult, TweetV2SingleResult, TweetV2PaginableTimelineParams, TweetV2CountResult, TweetV2CountParams, TweetV2CountAllResult, TweetV2CountAllParams, TweetV2RetweetedByResult, TweetV2LikedByResult, UserV2TimelineParams, UserV2TimelineResult, FollowersV2ParamsWithPaginator, FollowersV2ParamsWithoutPaginator, TweetSearchV2StreamParams, TweetV2SingleStreamResult, TweetV2PaginableListParams, SpaceV2FieldsParams, SpaceV2LookupResult, SpaceV2CreatorLookupParams, SpaceV2SearchParams, SpaceV2SingleResult, BatchComplianceSearchV2Params, BatchComplianceListV2Result, BatchComplianceV2Result, BatchComplianceV2Params, BatchComplianceV2JobResult, BatchComplianceJobV2, GetListV2Params, ListGetV2Result, GetListTimelineV2Params, TweetRetweetedOrLikedByV2ParamsWithPaginator, TweetRetweetedOrLikedByV2ParamsWithoutPaginator, SpaceV2BuyersParams, TweetV2HomeTimelineParams } from '../types';
import { TweetSearchAllV2Paginator, TweetSearchRecentV2Paginator, TweetUserMentionTimelineV2Paginator, TweetUserTimelineV2Paginator, TweetV2UserLikedTweetsPaginator, UserOwnedListsV2Paginator, UserListMembershipsV2Paginator, UserListFollowedV2Paginator, TweetV2ListTweetsPaginator, TweetBookmarksTimelineV2Paginator, QuotedTweetsTimelineV2Paginator, TweetHomeTimelineV2Paginator } from '../paginators';
import TwitterApiv2LabsReadOnly from '../v2-labs/client.v2.labs.read';
import { TweetLikingUsersV2Paginator, TweetRetweetersUsersV2Paginator, UserBlockingUsersV2Paginator, UserFollowersV2Paginator, UserFollowingV2Paginator, UserListFollowersV2Paginator, UserListMembersV2Paginator, UserMutingUsersV2Paginator } from '../paginators/user.paginator.v2';
import TweetStream from '../stream/TweetStream';
import { PromiseOrType } from '../types/shared.types';
/**
 * Base Twitter v2 client with only read right.
 */
export default class TwitterApiv2ReadOnly extends TwitterApiSubClient {
    protected _prefix: string;
    protected _labs?: TwitterApiv2LabsReadOnly;
    /**
     * Get a client for v2 labs endpoints.
     */
    get labs(): TwitterApiv2LabsReadOnly;
    /**
     * The recent search endpoint returns Tweets from the last seven days that match a search query.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent
     */
    search(options: Partial<Tweetv2SearchParams>): Promise<TweetSearchRecentV2Paginator>;
    search(query: string, options?: Partial<Tweetv2SearchParams>): Promise<TweetSearchRecentV2Paginator>;
    /**
     * The full-archive search endpoint returns the complete history of public Tweets matching a search query;
     * since the first Tweet was created March 26, 2006.
     *
     * This endpoint is only available to those users who have been approved for the Academic Research product track.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-all
     */
    searchAll(query: string, options?: Partial<Tweetv2SearchParams>): Promise<TweetSearchAllV2Paginator>;
    /**
     * Returns a variety of information about a single Tweet specified by the requested ID.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets-id
     *
     * OAuth2 scope: `users.read`, `tweet.read`
     */
    singleTweet(tweetId: string, options?: Partial<Tweetv2FieldsParams>): Promise<TweetV2SingleResult>;
    /**
     * Returns a variety of information about tweets specified by list of IDs.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets
     *
     * OAuth2 scope: `users.read`, `tweet.read`
     */
    tweets(tweetIds: string | string[], options?: Partial<Tweetv2FieldsParams>): Promise<TweetV2LookupResult>;
    /**
     * The recent Tweet counts endpoint returns count of Tweets from the last seven days that match a search query.
     * OAuth2 Bearer auth only.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/counts/api-reference/get-tweets-counts-recent
     */
    tweetCountRecent(query: string, options?: Partial<TweetV2CountParams>): Promise<TweetV2CountResult>;
    /**
     * This endpoint is only available to those users who have been approved for the Academic Research product track.
     * The full-archive search endpoint returns the complete history of public Tweets matching a search query;
     * since the first Tweet was created March 26, 2006.
     * OAuth2 Bearer auth only.
     * **This endpoint has pagination, yet it is not supported by bundled paginators. Use `next_token` to fetch next page.**
     * https://developer.twitter.com/en/docs/twitter-api/tweets/counts/api-reference/get-tweets-counts-all
     */
    tweetCountAll(query: string, options?: Partial<TweetV2CountAllParams>): Promise<TweetV2CountAllResult>;
    /**
     * Allows you to get information about who has Retweeted a Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/get-tweets-id-retweeted_by
     */
    tweetRetweetedBy(tweetId: string, options?: Partial<TweetRetweetedOrLikedByV2ParamsWithoutPaginator>): Promise<TweetV2RetweetedByResult>;
    tweetRetweetedBy(tweetId: string, options: TweetRetweetedOrLikedByV2ParamsWithPaginator): Promise<TweetRetweetersUsersV2Paginator>;
    /**
     * Allows you to get information about who has Liked a Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/get-tweets-id-liking_users
     */
    tweetLikedBy(tweetId: string, options?: Partial<TweetRetweetedOrLikedByV2ParamsWithoutPaginator>): Promise<TweetV2LikedByResult>;
    tweetLikedBy(tweetId: string, options: TweetRetweetedOrLikedByV2ParamsWithPaginator): Promise<TweetLikingUsersV2Paginator>;
    /**
     * Allows you to retrieve a collection of the most recent Tweets and Retweets posted by you and users you follow, also known as home timeline.
     * This endpoint returns up to the last 3200 Tweets.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-reverse-chronological
     *
     * OAuth 2 scopes: `tweet.read` `users.read`
     */
    homeTimeline(options?: Partial<TweetV2HomeTimelineParams>): Promise<TweetHomeTimelineV2Paginator>;
    /**
     * Returns Tweets composed by a single user, specified by the requested user ID.
     * By default, the most recent ten Tweets are returned per request.
     * Using pagination, the most recent 3,200 Tweets can be retrieved.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-tweets
     */
    userTimeline(userId: string, options?: Partial<TweetV2UserTimelineParams>): Promise<TweetUserTimelineV2Paginator>;
    /**
     * Returns Tweets mentioning a single user specified by the requested user ID.
     * By default, the most recent ten Tweets are returned per request.
     * Using pagination, up to the most recent 800 Tweets can be retrieved.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-mentions
     */
    userMentionTimeline(userId: string, options?: Partial<TweetV2PaginableTimelineParams>): Promise<TweetUserMentionTimelineV2Paginator>;
    /**
     * Returns Quote Tweets for a Tweet specified by the requested Tweet ID.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/quote-tweets/api-reference/get-tweets-id-quote_tweets
     *
     * OAuth2 scopes: `users.read` `tweet.read`
     */
    quotes(tweetId: string, options?: Partial<TweetV2PaginableTimelineParams>): Promise<QuotedTweetsTimelineV2Paginator>;
    /**
     * Allows you to get information about a authenticated user’s 800 most recent bookmarked Tweets.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/api-reference/get-users-id-bookmarks
     *
     * OAuth2 scopes: `users.read` `tweet.read` `bookmark.read`
     */
    bookmarks(options?: Partial<TweetV2PaginableTimelineParams>): Promise<TweetBookmarksTimelineV2Paginator>;
    /**
     * Returns information about an authorized user.
     * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-me
     *
     * OAuth2 scopes: `tweet.read` & `users.read`
     */
    me(options?: Partial<UsersV2Params>): Promise<UserV2Result>;
    /**
     * Returns a variety of information about a single user specified by the requested ID.
     * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-id
     */
    user(userId: string, options?: Partial<UsersV2Params>): Promise<UserV2Result>;
    /**
     * Returns a variety of information about one or more users specified by the requested IDs.
     * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users
     */
    users(userIds: string | string[], options?: Partial<UsersV2Params>): Promise<UsersV2Result>;
    /**
     * Returns a variety of information about a single user specified by their username.
     * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by-username-username
     */
    userByUsername(username: string, options?: Partial<UsersV2Params>): Promise<UserV2Result>;
    /**
     * Returns a variety of information about one or more users specified by their usernames.
     * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by
     *
     * OAuth2 scope: `users.read`, `tweet.read`
     */
    usersByUsernames(usernames: string | string[], options?: Partial<UsersV2Params>): Promise<UsersV2Result>;
    /**
     * Returns a list of users who are followers of the specified user ID.
     * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-followers
     */
    followers(userId: string, options?: Partial<FollowersV2ParamsWithoutPaginator>): Promise<UserV2TimelineResult>;
    followers(userId: string, options: FollowersV2ParamsWithPaginator): Promise<UserFollowersV2Paginator>;
    /**
     * Returns a list of users the specified user ID is following.
     * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following
     *
     * OAuth2 scope: `follows.read`
     */
    following(userId: string, options?: Partial<FollowersV2ParamsWithoutPaginator>): Promise<UserV2TimelineResult>;
    following(userId: string, options: FollowersV2ParamsWithPaginator): Promise<UserFollowingV2Paginator>;
    /**
     * Allows you to get information about a user’s liked Tweets.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/get-users-id-liked_tweets
     */
    userLikedTweets(userId: string, options?: Partial<TweetV2PaginableListParams>): Promise<TweetV2UserLikedTweetsPaginator>;
    /**
     * Returns a list of users who are blocked by the authenticating user.
     * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/get-users-blocking
     */
    userBlockingUsers(userId: string, options?: Partial<UserV2TimelineParams>): Promise<UserBlockingUsersV2Paginator>;
    /**
     * Returns a list of users who are muted by the authenticating user.
     * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/get-users-muting
     */
    userMutingUsers(userId: string, options?: Partial<UserV2TimelineParams>): Promise<UserMutingUsersV2Paginator>;
    /**
     * Returns the details of a specified List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/api-reference/get-lists-id
     */
    list(id: string, options?: Partial<GetListV2Params>): Promise<ListGetV2Result>;
    /**
     * Returns all Lists owned by the specified user.
     * https://developer.twitter.com/en/docs/twitter-api/lists/list-lookup/api-reference/get-users-id-owned_lists
     */
    listsOwned(userId: string, options?: Partial<GetListTimelineV2Params>): Promise<UserOwnedListsV2Paginator>;
    /**
     * Returns all Lists a specified user is a member of.
     * https://developer.twitter.com/en/docs/twitter-api/lists/list-members/api-reference/get-users-id-list_memberships
     */
    listMemberships(userId: string, options?: Partial<GetListTimelineV2Params>): Promise<UserListMembershipsV2Paginator>;
    /**
     * Returns all Lists a specified user follows.
     * https://developer.twitter.com/en/docs/twitter-api/lists/list-follows/api-reference/get-users-id-followed_lists
     */
    listFollowed(userId: string, options?: Partial<GetListTimelineV2Params>): Promise<UserListFollowedV2Paginator>;
    /**
     * Returns a list of Tweets from the specified List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/list-tweets/api-reference/get-lists-id-tweets
     */
    listTweets(listId: string, options?: Partial<TweetV2PaginableListParams>): Promise<TweetV2ListTweetsPaginator>;
    /**
     * Returns a list of users who are members of the specified List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/list-members/api-reference/get-lists-id-members
     */
    listMembers(listId: string, options?: Partial<UserV2TimelineParams>): Promise<UserListMembersV2Paginator>;
    /**
     * Returns a list of users who are followers of the specified List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/list-follows/api-reference/get-lists-id-followers
     */
    listFollowers(listId: string, options?: Partial<UserV2TimelineParams>): Promise<UserListFollowersV2Paginator>;
    /**
     * Get a single space by ID.
     * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-id
     *
     * OAuth2 scopes: `tweet.read`, `users.read`, `space.read`.
     */
    space(spaceId: string, options?: Partial<SpaceV2FieldsParams>): Promise<SpaceV2SingleResult>;
    /**
     * Get spaces using their IDs.
     * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces
     *
     * OAuth2 scopes: `tweet.read`, `users.read`, `space.read`.
     */
    spaces(spaceIds: string | string[], options?: Partial<SpaceV2FieldsParams>): Promise<SpaceV2LookupResult>;
    /**
     * Get spaces using their creator user ID(s). (no pagination available)
     * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-by-creator-ids
     *
     * OAuth2 scopes: `tweet.read`, `users.read`, `space.read`.
     */
    spacesByCreators(creatorIds: string | string[], options?: Partial<SpaceV2CreatorLookupParams>): Promise<SpaceV2LookupResult>;
    /**
     * Search through spaces using multiple params. (no pagination available)
     * https://developer.twitter.com/en/docs/twitter-api/spaces/search/api-reference/get-spaces-search
     */
    searchSpaces(options: SpaceV2SearchParams): Promise<SpaceV2LookupResult>;
    /**
    * Returns a list of user who purchased a ticket to the requested Space.
    * You must authenticate the request using the Access Token of the creator of the requested Space.
    *
    * **OAuth 2.0 Access Token required**
    *
    * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-id-buyers
    *
    * OAuth2 scopes: `tweet.read`, `users.read`, `space.read`.
    */
    spaceBuyers(spaceId: string, options?: Partial<SpaceV2BuyersParams>): Promise<UsersV2Result>;
    /**
     * Streams Tweets in real-time based on a specific set of filter rules.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream
     */
    searchStream(options?: Partial<TweetSearchV2StreamParams> & {
        autoConnect?: true;
    }): Promise<TweetStream<TweetV2SingleStreamResult>>;
    searchStream(options: Partial<TweetSearchV2StreamParams> & {
        autoConnect: false;
    }): TweetStream<TweetV2SingleStreamResult>;
    searchStream(options?: Partial<TweetSearchV2StreamParams> & {
        autoConnect?: boolean;
    }): PromiseOrType<TweetStream<TweetV2SingleStreamResult>>;
    /**
     * Return a list of rules currently active on the streaming endpoint, either as a list or individually.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream-rules
     */
    streamRules(options?: Partial<StreamingV2GetRulesParams>): Promise<StreamingV2GetRulesResult>;
    /**
     * Add or delete rules to your stream.
     * To create one or more rules, submit an add JSON body with an array of rules and operators.
     * Similarly, to delete one or more rules, submit a delete JSON body with an array of list of existing rule IDs.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/post-tweets-search-stream-rules
     */
    updateStreamRules(options: StreamingV2AddRulesParams, query?: Partial<StreamingV2UpdateRulesQuery>): Promise<StreamingV2UpdateRulesAddResult>;
    updateStreamRules(options: StreamingV2DeleteRulesParams, query?: Partial<StreamingV2UpdateRulesQuery>): Promise<StreamingV2UpdateRulesDeleteResult>;
    /**
     * Streams about 1% of all Tweets in real-time.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/volume-streams/api-reference/get-tweets-sample-stream
     */
    sampleStream(options?: Partial<Tweetv2FieldsParams> & {
        autoConnect?: true;
    }): Promise<TweetStream<TweetV2SingleResult>>;
    sampleStream(options: Partial<Tweetv2FieldsParams> & {
        autoConnect: false;
    }): TweetStream<TweetV2SingleResult>;
    sampleStream(options?: Partial<Tweetv2FieldsParams> & {
        autoConnect?: boolean;
    }): PromiseOrType<TweetStream<TweetV2SingleResult>>;
    /**
     * Returns a list of recent compliance jobs.
     * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/get-compliance-jobs
     */
    complianceJobs(options: BatchComplianceSearchV2Params): Promise<BatchComplianceListV2Result>;
    /**
     * Get a single compliance job with the specified ID.
     * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/get-compliance-jobs-id
     */
    complianceJob(jobId: string): Promise<BatchComplianceV2Result>;
    /**
     * Creates a new compliance job for Tweet IDs or user IDs, send your file, await result and parse it into an array.
     * You can run one batch job at a time. Returns the created job, but **not the job result!**.
     *
     * You can obtain the result (**after job is completed**) with `.complianceJobResult`.
     * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/post-compliance-jobs
     */
    sendComplianceJob(jobParams: BatchComplianceV2Params): Promise<BatchComplianceV2Result>;
    /**
     * Get the result of a running or completed job, obtained through `.complianceJob`, `.complianceJobs` or `.sendComplianceJob`.
     * If job is still running (`in_progress`), it will await until job is completed. **This could be quite long!**
     * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/post-compliance-jobs
     */
    complianceJobResult(job: BatchComplianceJobV2): Promise<BatchComplianceV2JobResult[]>;
}
