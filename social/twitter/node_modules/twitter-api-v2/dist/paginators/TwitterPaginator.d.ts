import { TwitterRateLimit, TwitterResponse } from '../types';
import TwitterApiSubClient from '../client.subclient';
export interface ITwitterPaginatorArgs<TApiResult, TApiParams, TParams> {
    realData: TApiResult;
    rateLimit: TwitterRateLimit;
    instance: TwitterApiSubClient;
    queryParams: Partial<TApiParams>;
    sharedParams?: TParams;
}
/** TwitterPaginator: able to get consume data from initial request, then fetch next data sequentially. */
export declare abstract class TwitterPaginator<TApiResult, TApiParams extends object, TItem, TParams = any> {
    protected _realData: TApiResult;
    protected _rateLimit: TwitterRateLimit;
    protected _instance: TwitterApiSubClient;
    protected _queryParams: Partial<TApiParams>;
    protected _maxResultsWhenFetchLast: number;
    /** informations unrelated to response data/query params that will be shared between paginator instances */
    protected _sharedParams: TParams;
    protected abstract _endpoint: string;
    constructor({ realData, rateLimit, instance, queryParams, sharedParams }: ITwitterPaginatorArgs<TApiResult, TApiParams, TParams>);
    protected get _isRateLimitOk(): boolean;
    protected makeRequest(queryParams: Partial<TApiParams>): Promise<TwitterResponse<TApiResult>>;
    protected makeNewInstanceFromResult(result: TwitterResponse<TApiResult>, queryParams: Partial<TApiParams>): this;
    protected getEndpoint(): string;
    protected injectQueryParams(maxResults?: number): {
        max_results?: number | undefined;
    } & Partial<TApiParams>;
    protected abstract refreshInstanceFromResult(result: TwitterResponse<TApiResult>, isNextPage: boolean): any;
    protected abstract getNextQueryParams(maxResults?: number): Partial<TApiParams>;
    protected abstract getPageLengthFromRequest(result: TwitterResponse<TApiResult>): number;
    protected abstract isFetchLastOver(result: TwitterResponse<TApiResult>): boolean;
    protected abstract canFetchNextPage(result: TApiResult): boolean;
    protected abstract getItemArray(): TItem[];
    /**
     * Next page.
     */
    next(maxResults?: number): Promise<this>;
    /**
     * Next page, but store it in current instance.
     */
    fetchNext(maxResults?: number): Promise<this>;
    /**
     * Fetch up to {count} items after current page,
     * as long as rate limit is not hit and Twitter has some results
     */
    fetchLast(count?: number): Promise<this>;
    get rateLimit(): {
        limit: number;
        reset: number;
        remaining: number;
    };
    /** Get raw data returned by Twitter API. */
    get data(): TApiResult;
    get done(): boolean;
    /**
     * Iterate over currently fetched items.
     */
    [Symbol.iterator](): Generator<TItem, void, undefined>;
    /**
     * Iterate over items "undefinitely" (until rate limit is hit / they're no more items available)
     * This will **mutate the current instance** and fill data, metas, etc. inside this instance.
     *
     * If you need to handle concurrent requests, or you need to rely on immutability, please use `.fetchAndIterate()` instead.
     */
    [Symbol.asyncIterator](): AsyncGenerator<TItem, void, undefined>;
    /**
     * Iterate over items "undefinitely" without modifying the current instance (until rate limit is hit / they're no more items available)
     *
     * This will **NOT** mutate the current instance, meaning that current instance will not inherit from `includes` and `meta` (v2 API only).
     * Use `Symbol.asyncIterator` (`for-await of`) to directly access items with current instance mutation.
     */
    fetchAndIterate(): AsyncGenerator<[TItem, this], void, undefined>;
}
/** PreviousableTwitterPaginator: a TwitterPaginator able to get consume data from both side, next and previous. */
export declare abstract class PreviousableTwitterPaginator<TApiResult, TApiParams extends object, TItem, TParams = any> extends TwitterPaginator<TApiResult, TApiParams, TItem, TParams> {
    protected abstract getPreviousQueryParams(maxResults?: number): Partial<TApiParams>;
    /**
     * Previous page (new tweets)
     */
    previous(maxResults?: number): Promise<this>;
    /**
     * Previous page, but in current instance.
     */
    fetchPrevious(maxResults?: number): Promise<this>;
}
export default TwitterPaginator;
