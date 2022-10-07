import { UserV2, UserV2TimelineParams, UserV2TimelineResult } from '../types';
import { TimelineV2Paginator } from './v2.paginator';
/** A generic PreviousableTwitterPaginator able to consume UserV2 timelines. */
declare abstract class UserTimelineV2Paginator<TResult extends UserV2TimelineResult, TParams extends UserV2TimelineParams, TShared = any> extends TimelineV2Paginator<TResult, TParams, UserV2, TShared> {
    protected getItemArray(): UserV2[];
    /**
     * Users returned by paginator.
     */
    get users(): UserV2[];
    get meta(): TResult["meta"];
}
export declare class UserBlockingUsersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class UserMutingUsersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class UserFollowersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class UserFollowingV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class UserListMembersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class UserListFollowersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class TweetLikingUsersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export declare class TweetRetweetersUsersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, {
    id: string;
}> {
    protected _endpoint: string;
}
export {};
