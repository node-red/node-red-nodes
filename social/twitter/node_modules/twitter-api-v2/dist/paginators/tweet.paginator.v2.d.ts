import { Tweetv2SearchParams, Tweetv2SearchResult, TwitterResponse, TweetV2, Tweetv2TimelineResult, TweetV2TimelineParams, TweetV2PaginableTimelineResult, TweetV2UserTimelineParams, Tweetv2ListResult, TweetV2PaginableListParams, TweetV2PaginableTimelineParams, TweetV2HomeTimelineParams } from '../types';
import { TimelineV2Paginator, TwitterV2Paginator } from './v2.paginator';
/** A generic PreviousableTwitterPaginator able to consume TweetV2 timelines with since_id, until_id and next_token (when available). */
declare abstract class TweetTimelineV2Paginator<TResult extends Tweetv2TimelineResult, TParams extends TweetV2TimelineParams, TShared = any> extends TwitterV2Paginator<TResult, TParams, TweetV2, TShared> {
    protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean): void;
    protected getNextQueryParams(maxResults?: number): Partial<TParams>;
    protected getPreviousQueryParams(maxResults?: number): Partial<TParams>;
    protected getPageLengthFromRequest(result: TwitterResponse<TResult>): number;
    protected isFetchLastOver(result: TwitterResponse<TResult>): boolean;
    protected canFetchNextPage(result: TResult): boolean;
    protected getItemArray(): TweetV2[];
    protected dateStringToSnowflakeId(dateStr: string): string;
    /**
     * Tweets returned by paginator.
     */
    get tweets(): TweetV2[];
    get meta(): TResult["meta"];
}
/** A generic PreviousableTwitterPaginator able to consume TweetV2 timelines with pagination_tokens. */
declare abstract class TweetPaginableTimelineV2Paginator<TResult extends TweetV2PaginableTimelineResult, TParams extends TweetV2PaginableTimelineParams, TShared = any> extends TimelineV2Paginator<TResult, TParams, TweetV2, TShared> {
    protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean): void;
    protected getItemArray(): TweetV2[];
    /**
     * Tweets returned by paginator.
     */
    get tweets(): TweetV2[];
    get meta(): TResult["meta"];
}
export declare class TweetSearchRecentV2Paginator extends TweetTimelineV2Paginator<Tweetv2SearchResult, Tweetv2SearchParams> {
    protected _endpoint: string;
}
export declare class TweetSearchAllV2Paginator extends TweetTimelineV2Paginator<Tweetv2SearchResult, Tweetv2SearchParams> {
    protected _endpoint: string;
}
export declare class QuotedTweetsTimelineV2Paginator extends TweetPaginableTimelineV2Paginator<TweetV2PaginableTimelineResult, TweetV2PaginableTimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class TweetHomeTimelineV2Paginator extends TweetPaginableTimelineV2Paginator<TweetV2PaginableTimelineResult, TweetV2HomeTimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
declare type TUserTimelinePaginatorShared = {
    id: string;
};
export declare class TweetUserTimelineV2Paginator extends TweetPaginableTimelineV2Paginator<TweetV2PaginableTimelineResult, TweetV2UserTimelineParams, TUserTimelinePaginatorShared> {
    protected _endpoint: string;
}
export declare class TweetUserMentionTimelineV2Paginator extends TweetPaginableTimelineV2Paginator<TweetV2PaginableTimelineResult, TweetV2PaginableTimelineParams, TUserTimelinePaginatorShared> {
    protected _endpoint: string;
}
export declare class TweetBookmarksTimelineV2Paginator extends TweetPaginableTimelineV2Paginator<TweetV2PaginableTimelineResult, TweetV2PaginableTimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
/** A generic TwitterPaginator able to consume TweetV2 timelines. */
declare abstract class TweetListV2Paginator<TResult extends Tweetv2ListResult, TParams extends TweetV2PaginableListParams, TShared = any> extends TimelineV2Paginator<TResult, TParams, TweetV2, TShared> {
    /**
     * Tweets returned by paginator.
     */
    get tweets(): TweetV2[];
    get meta(): TResult["meta"];
    protected getItemArray(): TweetV2[];
}
export declare class TweetV2UserLikedTweetsPaginator extends TweetListV2Paginator<Tweetv2ListResult, TweetV2PaginableListParams, TUserTimelinePaginatorShared> {
    protected _endpoint: string;
}
export declare class TweetV2ListTweetsPaginator extends TweetListV2Paginator<Tweetv2ListResult, TweetV2PaginableListParams, TUserTimelinePaginatorShared> {
    protected _endpoint: string;
}
export {};
