/// <reference types="node" />
import { IClientSettings, ITwitterApiClientPlugin, TClientTokens, TwitterApiPluginResponseOverride, TwitterRateLimit, TwitterResponse } from '../types';
import TweetStream from '../stream/TweetStream';
import type { ClientRequestArgs } from 'http';
import OAuth1Helper from './oauth1.helper';
import type { IGetHttpRequestArgs, IGetStreamRequestArgs, IGetStreamRequestArgsAsync, IGetStreamRequestArgsSync, IWriteAuthHeadersArgs, TAcceptedInitToken } from '../types/request-maker.mixin.types';
import { IComputedHttpRequestArgs } from '../types/request-maker.mixin.types';
export declare class ClientRequestMaker {
    bearerToken?: string;
    consumerToken?: string;
    consumerSecret?: string;
    accessToken?: string;
    accessSecret?: string;
    basicToken?: string;
    clientId?: string;
    clientSecret?: string;
    rateLimits: {
        [endpoint: string]: TwitterRateLimit;
    };
    clientSettings: Partial<IClientSettings>;
    protected _oauth?: OAuth1Helper;
    protected static readonly BODY_METHODS: Set<string>;
    constructor(settings?: Partial<IClientSettings>);
    /** @deprecated - Switch to `@twitter-api-v2/plugin-rate-limit` */
    getRateLimits(): {
        [endpoint: string]: TwitterRateLimit;
    };
    protected saveRateLimit(originalUrl: string, rateLimit: TwitterRateLimit): void;
    /** Send a new request and returns a wrapped `Promise<TwitterResponse<T>`. */
    send<T = any>(requestParams: IGetHttpRequestArgs): Promise<TwitterResponse<T>>;
    /**
     * Create a new request, then creates a stream from it as a `TweetStream`.
     *
     * Request will be sent only if `autoConnect` is not set or `true`: return type will be `Promise<TweetStream>`.
     * If `autoConnect` is `false`, a `TweetStream` is directly returned and you should call `stream.connect()` by yourself.
     */
    sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgsSync): TweetStream<T>;
    sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgsAsync): Promise<TweetStream<T>>;
    sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgs): Promise<TweetStream<T>> | TweetStream<T>;
    initializeToken(token?: TAcceptedInitToken): void;
    getActiveTokens(): TClientTokens;
    protected buildOAuth(): OAuth1Helper;
    protected getOAuthAccessTokens(): {
        key: string;
        secret: string;
    } | undefined;
    getPlugins(): ITwitterApiClientPlugin[];
    hasPlugins(): boolean;
    applyPluginMethod<K extends keyof ITwitterApiClientPlugin>(method: K, args: Parameters<Required<ITwitterApiClientPlugin>[K]>[0]): Promise<TwitterApiPluginResponseOverride | undefined>;
    protected writeAuthHeaders({ headers, bodyInSignature, url, method, query, body }: IWriteAuthHeadersArgs): Record<string, string>;
    protected getUrlObjectFromUrlString(url: string): URL;
    protected getHttpRequestArgs({ url: stringUrl, method, query: rawQuery, body: rawBody, headers, forceBodyMode, enableAuth, params, }: IGetHttpRequestArgs): IComputedHttpRequestArgs;
    protected applyPreRequestConfigHooks(requestParams: IGetHttpRequestArgs): Promise<TwitterResponse<any> | undefined>;
    protected applyPreStreamRequestConfigHooks(requestParams: IGetHttpRequestArgs): void;
    protected applyPreRequestHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, requestOptions: Partial<ClientRequestArgs>): Promise<void>;
    protected applyPostRequestHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, requestOptions: Partial<ClientRequestArgs>, response: TwitterResponse<any>): Promise<TwitterApiPluginResponseOverride | undefined>;
    protected applyResponseErrorHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, requestOptions: Partial<ClientRequestArgs>, promise: Promise<TwitterResponse<any>>): Promise<TwitterResponse<any>>;
}
