import { DoubleEndedListsCursorV1Result, DoubleEndedUsersCursorV1Result, ListMembersV1Params, ListOwnershipsV1Params, ListV1, TwitterResponse, UserV1 } from '../types';
import { CursoredV1Paginator } from './paginator.v1';
declare abstract class ListListsV1Paginator extends CursoredV1Paginator<DoubleEndedListsCursorV1Result, ListOwnershipsV1Params, ListV1> {
    protected refreshInstanceFromResult(response: TwitterResponse<DoubleEndedListsCursorV1Result>, isNextPage: true): void;
    protected getPageLengthFromRequest(result: TwitterResponse<DoubleEndedListsCursorV1Result>): number;
    protected getItemArray(): ListV1[];
    /**
     * Lists returned by paginator.
     */
    get lists(): ListV1[];
}
export declare class ListMembershipsV1Paginator extends ListListsV1Paginator {
    protected _endpoint: string;
}
export declare class ListOwnershipsV1Paginator extends ListListsV1Paginator {
    protected _endpoint: string;
}
export declare class ListSubscriptionsV1Paginator extends ListListsV1Paginator {
    protected _endpoint: string;
}
declare abstract class ListUsersV1Paginator extends CursoredV1Paginator<DoubleEndedUsersCursorV1Result, ListMembersV1Params, UserV1> {
    protected refreshInstanceFromResult(response: TwitterResponse<DoubleEndedUsersCursorV1Result>, isNextPage: true): void;
    protected getPageLengthFromRequest(result: TwitterResponse<DoubleEndedUsersCursorV1Result>): number;
    protected getItemArray(): UserV1[];
    /**
     * Users returned by paginator.
     */
    get users(): UserV1[];
}
export declare class ListMembersV1Paginator extends ListUsersV1Paginator {
    protected _endpoint: string;
}
export declare class ListSubscribersV1Paginator extends ListUsersV1Paginator {
    protected _endpoint: string;
}
export {};
