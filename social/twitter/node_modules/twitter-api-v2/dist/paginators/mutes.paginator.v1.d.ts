import { CursoredV1Paginator } from './paginator.v1';
import type { MuteUserIdsV1Params, MuteUserIdsV1Result, MuteUserListV1Params, MuteUserListV1Result, TwitterResponse, UserV1 } from '../types';
export declare class MuteUserListV1Paginator extends CursoredV1Paginator<MuteUserListV1Result, MuteUserListV1Params, UserV1> {
    protected _endpoint: string;
    protected refreshInstanceFromResult(response: TwitterResponse<MuteUserListV1Result>, isNextPage: true): void;
    protected getPageLengthFromRequest(result: TwitterResponse<MuteUserListV1Result>): number;
    protected getItemArray(): UserV1[];
    /**
     * Users returned by paginator.
     */
    get users(): UserV1[];
}
export declare class MuteUserIdsV1Paginator extends CursoredV1Paginator<MuteUserIdsV1Result, MuteUserIdsV1Params, string> {
    protected _endpoint: string;
    protected _maxResultsWhenFetchLast: number;
    protected refreshInstanceFromResult(response: TwitterResponse<MuteUserIdsV1Result>, isNextPage: true): void;
    protected getPageLengthFromRequest(result: TwitterResponse<MuteUserIdsV1Result>): number;
    protected getItemArray(): string[];
    /**
     * Users IDs returned by paginator.
     */
    get ids(): string[];
}
