import TwitterApiv2ReadOnly from './client.v2.read';
import type { ListCreateV2Params, ListCreateV2Result, ListDeleteV2Result, ListFollowV2Result, ListMemberV2Result, ListPinV2Result, ListUpdateV2Params, ListUpdateV2Result, TweetV2DeleteTweetResult, SendTweetV2Params, TweetV2HideReplyResult, TweetV2LikeResult, TweetV2PostTweetResult, TweetV2RetweetResult, UserV2BlockResult, UserV2FollowResult, UserV2MuteResult, UserV2UnfollowResult, TweetV2BookmarkResult } from '../types';
import TwitterApiv2LabsReadWrite from '../v2-labs/client.v2.labs.write';
/**
 * Base Twitter v2 client with read/write rights.
 */
export default class TwitterApiv2ReadWrite extends TwitterApiv2ReadOnly {
    protected _prefix: string;
    protected _labs?: TwitterApiv2LabsReadWrite;
    /**
     * Get a client with only read rights.
     */
    get readOnly(): TwitterApiv2ReadOnly;
    /**
     * Get a client for v2 labs endpoints.
     */
    get labs(): TwitterApiv2LabsReadWrite;
    /**
     * Hides or unhides a reply to a Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/hide-replies/api-reference/put-tweets-id-hidden
     */
    hideReply(tweetId: string, makeHidden: boolean): Promise<TweetV2HideReplyResult>;
    /**
     * Causes the user ID identified in the path parameter to Like the target Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/post-users-user_id-likes
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    like(loggedUserId: string, targetTweetId: string): Promise<TweetV2LikeResult>;
    /**
     * Allows a user or authenticated user ID to unlike a Tweet.
     * The request succeeds with no action when the user sends a request to a user they're not liking the Tweet or have already unliked the Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/delete-users-id-likes-tweet_id
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unlike(loggedUserId: string, targetTweetId: string): Promise<TweetV2LikeResult>;
    /**
     * Causes the user ID identified in the path parameter to Retweet the target Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/post-users-id-retweets
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    retweet(loggedUserId: string, targetTweetId: string): Promise<TweetV2RetweetResult>;
    /**
     * Allows a user or authenticated user ID to remove the Retweet of a Tweet.
     * The request succeeds with no action when the user sends a request to a user they're not Retweeting the Tweet or have already removed the Retweet of.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/delete-users-id-retweets-tweet_id
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unretweet(loggedUserId: string, targetTweetId: string): Promise<TweetV2RetweetResult>;
    /**
     * Creates a Tweet on behalf of an authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
     */
    tweet(status: string, payload?: Partial<SendTweetV2Params>): Promise<TweetV2PostTweetResult>;
    tweet(payload: SendTweetV2Params): Promise<TweetV2PostTweetResult>;
    /**
     * Reply to a Tweet on behalf of an authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
     */
    reply(status: string, toTweetId: string, payload?: Partial<SendTweetV2Params>): Promise<TweetV2PostTweetResult>;
    /**
     * Quote an existing Tweet on behalf of an authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
     */
    quote(status: string, quotedTweetId: string, payload?: Partial<SendTweetV2Params>): Promise<TweetV2PostTweetResult>;
    /**
     * Post a series of tweets.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
     */
    tweetThread(tweets: (SendTweetV2Params | string)[]): Promise<TweetV2PostTweetResult[]>;
    /**
     * Allows a user or authenticated user ID to delete a Tweet
     * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/delete-tweets-id
     */
    deleteTweet(tweetId: string): Promise<TweetV2DeleteTweetResult>;
    /**
     * Causes the user ID of an authenticated user identified in the path parameter to Bookmark the target Tweet provided in the request body.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/api-reference/post-users-id-bookmarks
     *
     * OAuth2 scopes: `users.read` `tweet.read` `bookmark.write`
     */
    bookmark(tweetId: string): Promise<TweetV2BookmarkResult>;
    /**
     * Allows a user or authenticated user ID to remove a Bookmark of a Tweet.
     * https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/api-reference/delete-users-id-bookmarks-tweet_id
     *
     * OAuth2 scopes: `users.read` `tweet.read` `bookmark.write`
     */
    deleteBookmark(tweetId: string): Promise<TweetV2BookmarkResult>;
    /**
     * Allows a user ID to follow another user.
     * If the target user does not have public Tweets, this endpoint will send a follow request.
     * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/post-users-source_user_id-following
     *
     * OAuth2 scope: `follows.write`
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    follow(loggedUserId: string, targetUserId: string): Promise<UserV2FollowResult>;
    /**
     * Allows a user ID to unfollow another user.
     * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/delete-users-source_id-following
     *
     * OAuth2 scope: `follows.write`
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unfollow(loggedUserId: string, targetUserId: string): Promise<UserV2UnfollowResult>;
    /**
     * Causes the user (in the path) to block the target user.
     * The user (in the path) must match the user context authorizing the request.
     * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/post-users-user_id-blocking
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    block(loggedUserId: string, targetUserId: string): Promise<UserV2BlockResult>;
    /**
     * Allows a user or authenticated user ID to unblock another user.
     * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/delete-users-user_id-blocking
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unblock(loggedUserId: string, targetUserId: string): Promise<UserV2BlockResult>;
    /**
     * Allows an authenticated user ID to mute the target user.
     * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/post-users-user_id-muting
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    mute(loggedUserId: string, targetUserId: string): Promise<UserV2MuteResult>;
    /**
     * Allows an authenticated user ID to unmute the target user.
     * The request succeeds with no action when the user sends a request to a user they're not muting or have already unmuted.
     * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/delete-users-user_id-muting
     *
     * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
     */
    unmute(loggedUserId: string, targetUserId: string): Promise<UserV2MuteResult>;
    /**
     * Creates a new list for the authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-lists
     */
    createList(options: ListCreateV2Params): Promise<ListCreateV2Result>;
    /**
     * Updates the specified list. The authenticated user must own the list to be able to update it.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/put-lists-id
     */
    updateList(listId: string, options?: ListUpdateV2Params): Promise<ListUpdateV2Result>;
    /**
     * Deletes the specified list. The authenticated user must own the list to be able to destroy it.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-lists-id
     */
    removeList(listId: string): Promise<ListDeleteV2Result>;
    /**
     * Adds a member to a list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-lists-id-members
     */
    addListMember(listId: string, userId: string): Promise<ListMemberV2Result>;
    /**
     * Remember a member to a list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-lists-id-members-user_id
     */
    removeListMember(listId: string, userId: string): Promise<ListMemberV2Result>;
    /**
     * Subscribes the authenticated user to the specified list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-users-id-followed-lists
     */
    subscribeToList(loggedUserId: string, listId: string): Promise<ListFollowV2Result>;
    /**
     * Unsubscribes the authenticated user to the specified list.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-users-id-followed-lists-list_id
     */
    unsubscribeOfList(loggedUserId: string, listId: string): Promise<ListFollowV2Result>;
    /**
     * Enables the authenticated user to pin a List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-users-id-pinned-lists
     */
    pinList(loggedUserId: string, listId: string): Promise<ListPinV2Result>;
    /**
     * Enables the authenticated user to unpin a List.
     * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-users-id-pinned-lists-list_id
     */
    unpinList(loggedUserId: string, listId: string): Promise<ListPinV2Result>;
}
