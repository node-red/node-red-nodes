/// <reference types="node" />
import type { ClientRequestArgs } from 'http';
import type { IGetHttpRequestArgs } from '../request-maker.mixin.types';
import type { TwitterResponse } from '../responses.types';
import type { IComputedHttpRequestArgs } from '../request-maker.mixin.types';
import type { IOAuth2RequestTokenResult, RequestTokenResult } from '../auth.types';
import type { PromiseOrType } from '../shared.types';
import type { ApiResponseError, ApiRequestError, ApiPartialResponseError } from '../errors.types';
import type { ClientRequestMaker } from '../../client-mixins/request-maker.mixin';
export declare class TwitterApiPluginResponseOverride {
    value: any;
    constructor(value: any);
}
export interface ITwitterApiClientPlugin {
    onBeforeRequestConfig?: TTwitterApiBeforeRequestConfigHook;
    onBeforeRequest?: TTwitterApiBeforeRequestHook;
    onAfterRequest?: TTwitterApiAfterRequestHook;
    onRequestError?: TTwitterApiRequestErrorHook;
    onResponseError?: TTwitterApiResponseErrorHook;
    onBeforeStreamRequestConfig?: TTwitterApiBeforeStreamRequestConfigHook;
    onOAuth1RequestToken?: TTwitterApiAfterOAuth1RequestTokenHook;
    onOAuth2RequestToken?: TTwitterApiAfterOAuth2RequestTokenHook;
}
export interface ITwitterApiBeforeRequestConfigHookArgs {
    client: ClientRequestMaker;
    url: URL;
    params: IGetHttpRequestArgs;
}
export interface ITwitterApiBeforeRequestHookArgs extends ITwitterApiBeforeRequestConfigHookArgs {
    computedParams: IComputedHttpRequestArgs;
    requestOptions: Partial<ClientRequestArgs>;
}
export interface ITwitterApiAfterRequestHookArgs extends ITwitterApiBeforeRequestHookArgs {
    response: TwitterResponse<any>;
}
export interface ITwitterApiRequestErrorHookArgs extends ITwitterApiBeforeRequestHookArgs {
    error: ApiRequestError | ApiPartialResponseError;
}
export interface ITwitterApiResponseErrorHookArgs extends ITwitterApiBeforeRequestHookArgs {
    error: ApiResponseError;
}
export declare type TTwitterApiBeforeRequestConfigHook = (args: ITwitterApiBeforeRequestConfigHookArgs) => PromiseOrType<TwitterResponse<any> | void>;
export declare type TTwitterApiBeforeRequestHook = (args: ITwitterApiBeforeRequestHookArgs) => void | Promise<void>;
export declare type TTwitterApiAfterRequestHook = (args: ITwitterApiAfterRequestHookArgs) => PromiseOrType<TwitterApiPluginResponseOverride | void>;
export declare type TTwitterApiRequestErrorHook = (args: ITwitterApiRequestErrorHookArgs) => PromiseOrType<TwitterApiPluginResponseOverride | void>;
export declare type TTwitterApiResponseErrorHook = (args: ITwitterApiResponseErrorHookArgs) => PromiseOrType<TwitterApiPluginResponseOverride | void>;
export declare type TTwitterApiBeforeStreamRequestConfigHook = (args: ITwitterApiBeforeRequestConfigHookArgs) => void;
export interface ITwitterApiAfterOAuth1RequestTokenHookArgs {
    client: ClientRequestMaker;
    url: string;
    oauthResult: RequestTokenResult;
}
export interface ITwitterApiAfterOAuth2RequestTokenHookArgs {
    client: ClientRequestMaker;
    result: IOAuth2RequestTokenResult;
    redirectUri: string;
}
export declare type TTwitterApiAfterOAuth1RequestTokenHook = (args: ITwitterApiAfterOAuth1RequestTokenHookArgs) => void | Promise<void>;
export declare type TTwitterApiAfterOAuth2RequestTokenHook = (args: ITwitterApiAfterOAuth2RequestTokenHookArgs) => void | Promise<void>;
