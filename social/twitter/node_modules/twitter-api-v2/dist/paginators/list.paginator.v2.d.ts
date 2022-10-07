import type { GetListTimelineV2Params, ListTimelineV2Result, ListV2 } from '../types';
import { TimelineV2Paginator } from './v2.paginator';
declare abstract class ListTimelineV2Paginator<TResult extends ListTimelineV2Result, TParams extends GetListTimelineV2Params, TShared = any> extends TimelineV2Paginator<TResult, TParams, ListV2, TShared> {
    protected getItemArray(): ListV2[];
    /**
     * Lists returned by paginator.
     */
    get lists(): ListV2[];
    get meta(): TResult["meta"];
}
export declare class UserOwnedListsV2Paginator extends ListTimelineV2Paginator<ListTimelineV2Result, GetListTimelineV2Params, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class UserListMembershipsV2Paginator extends ListTimelineV2Paginator<ListTimelineV2Result, GetListTimelineV2Params, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class UserListFollowedV2Paginator extends ListTimelineV2Paginator<ListTimelineV2Result, GetListTimelineV2Params, {
    id: string;
}> {
    protected _endpoint: string;
}
export {};
