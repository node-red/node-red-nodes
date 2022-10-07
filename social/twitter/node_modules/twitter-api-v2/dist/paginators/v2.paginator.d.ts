import type { TwitterResponse } from '../types';
import type { DataMetaAndIncludeV2 } from '../types/v2/shared.v2.types';
import { TwitterV2IncludesHelper } from '../v2/includes.v2.helper';
import { PreviousableTwitterPaginator } from './TwitterPaginator';
/** A generic PreviousableTwitterPaginator with common v2 helper methods. */
export declare abstract class TwitterV2Paginator<TResult extends DataMetaAndIncludeV2<any, any, any>, TParams extends object, TItem, TShared = any> extends PreviousableTwitterPaginator<TResult, TParams, TItem, TShared> {
    protected _includesInstance?: TwitterV2IncludesHelper;
    protected updateIncludes(data: TResult): void;
    /** Throw if the current paginator is not usable. */
    protected assertUsable(): void;
    get meta(): any;
    get includes(): TwitterV2IncludesHelper;
    get errors(): import("../types").InlineErrorV2[];
    /** `true` if this paginator only contains error payload and no metadata found to consume data. */
    get unusable(): boolean;
}
/** A generic TwitterV2Paginator able to consume v2 timelines that use max_results and pagination tokens. */
export declare abstract class TimelineV2Paginator<TResult extends DataMetaAndIncludeV2<any, any, any>, TParams extends {
    max_results?: number;
    pagination_token?: string;
}, TItem, TShared = any> extends TwitterV2Paginator<TResult, TParams, TItem, TShared> {
    protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean): void;
    protected getNextQueryParams(maxResults?: number): {
        max_results?: number | undefined;
    } & Partial<TParams> & {
        pagination_token: any;
    };
    protected getPreviousQueryParams(maxResults?: number): {
        max_results?: number | undefined;
    } & Partial<TParams> & {
        pagination_token: any;
    };
    protected getPageLengthFromRequest(result: TwitterResponse<TResult>): any;
    protected isFetchLastOver(result: TwitterResponse<TResult>): boolean;
    protected canFetchNextPage(result: TResult): boolean;
}
