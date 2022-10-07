import { TwitterResponse } from '../types';
import TwitterPaginator from './TwitterPaginator';
export declare abstract class CursoredV1Paginator<TApiResult extends {
    next_cursor_str?: string;
    next_cursor?: string;
}, TApiParams extends {
    cursor?: string;
}, TItem, TParams = any> extends TwitterPaginator<TApiResult, TApiParams, TItem, TParams> {
    protected getNextQueryParams(maxResults?: number): Partial<TApiParams>;
    protected isFetchLastOver(result: TwitterResponse<TApiResult>): boolean;
    protected canFetchNextPage(result: TApiResult): boolean;
    private isNextCursorInvalid;
}
