import TwitterPaginator from './TwitterPaginator';
import { FriendshipsIncomingV1Params, FriendshipsIncomingV1Result, TwitterResponse, UserSearchV1Params, UserV1 } from '../types';
import { CursoredV1Paginator } from './paginator.v1';
/** A generic TwitterPaginator able to consume TweetV1 timelines. */
export declare class UserSearchV1Paginator extends TwitterPaginator<UserV1[], UserSearchV1Params, UserV1> {
    _endpoint: string;
    protected refreshInstanceFromResult(response: TwitterResponse<UserV1[]>, isNextPage: true): void;
    protected getNextQueryParams(maxResults?: number): {
        count?: number | undefined;
        page: number;
        q?: string | undefined;
        include_entities?: boolean | undefined;
        tweet_mode?: "extended" | undefined;
    };
    protected getPageLengthFromRequest(result: TwitterResponse<UserV1[]>): number;
    protected isFetchLastOver(result: TwitterResponse<UserV1[]>): boolean;
    protected canFetchNextPage(result: UserV1[]): boolean;
    protected getItemArray(): UserV1[];
    /**
     * Users returned by paginator.
     */
    get users(): UserV1[];
}
export declare class FriendshipsIncomingV1Paginator extends CursoredV1Paginator<FriendshipsIncomingV1Result, FriendshipsIncomingV1Params, string> {
    protected _endpoint: string;
    protected _maxResultsWhenFetchLast: number;
    protected refreshInstanceFromResult(response: TwitterResponse<FriendshipsIncomingV1Result>, isNextPage: true): void;
    protected getPageLengthFromRequest(result: TwitterResponse<FriendshipsIncomingV1Result>): number;
    protected getItemArray(): string[];
    /**
     * Users IDs returned by paginator.
     */
    get ids(): string[];
}
export declare class FriendshipsOutgoingV1Paginator extends FriendshipsIncomingV1Paginator {
    protected _endpoint: string;
}
