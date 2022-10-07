import type { GetDmListV1Args, ReceivedDMEventsV1, TReceivedDMEvent, TwitterResponse, ReceivedWelcomeDMCreateEventV1, WelcomeDirectMessageListV1Result } from '../types';
import { CursoredV1Paginator } from './paginator.v1';
export declare class DmEventsV1Paginator extends CursoredV1Paginator<ReceivedDMEventsV1, GetDmListV1Args, TReceivedDMEvent> {
    protected _endpoint: string;
    protected refreshInstanceFromResult(response: TwitterResponse<ReceivedDMEventsV1>, isNextPage: true): void;
    protected getPageLengthFromRequest(result: TwitterResponse<ReceivedDMEventsV1>): number;
    protected getItemArray(): import("../types").DirectMessageCreateV1[];
    /**
     * Events returned by paginator.
     */
    get events(): import("../types").DirectMessageCreateV1[];
}
export declare class WelcomeDmV1Paginator extends CursoredV1Paginator<WelcomeDirectMessageListV1Result, GetDmListV1Args, ReceivedWelcomeDMCreateEventV1> {
    protected _endpoint: string;
    protected refreshInstanceFromResult(response: TwitterResponse<WelcomeDirectMessageListV1Result>, isNextPage: true): void;
    protected getPageLengthFromRequest(result: TwitterResponse<WelcomeDirectMessageListV1Result>): number;
    protected getItemArray(): ReceivedWelcomeDMCreateEventV1[];
    get welcomeMessages(): ReceivedWelcomeDMCreateEventV1[];
}
