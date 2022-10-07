import type { IClientSettings, ITwitterApiClientPlugin, TwitterApiBasicAuth, TwitterApiOAuth2Init, TwitterApiTokens, TwitterRateLimit, TwitterResponse, UserV1, UserV2Result } from './types';
import { ClientRequestMaker } from './client-mixins/request-maker.mixin';
import TweetStream from './stream/TweetStream';
import { SharedPromise } from './helpers';
import type { TCustomizableRequestArgs, TRequestBody, TRequestQuery } from './types/request-maker.mixin.types';
export declare type TGetClientRequestArgs = TCustomizableRequestArgs & {
    prefix?: string;
    fullResponse?: boolean;
};
declare type TGetClientRequestArgsFullResponse = TClientRequestArgs & {
    fullResponse: true;
};
declare type TGetClientRequestArgsDataResponse = TClientRequestArgs & {
    fullResponse?: false;
};
export declare type TClientRequestArgs = TCustomizableRequestArgs & {
    prefix?: string;
    fullResponse?: boolean;
    query?: TRequestQuery;
};
declare type TClientRequestArgsFullResponse = TClientRequestArgs & {
    fullResponse: true;
};
declare type TClientRequestArgsDataResponse = TClientRequestArgs & {
    fullResponse?: false;
};
export declare type TStreamClientRequestArgs = TCustomizableRequestArgs & {
    prefix?: string;
    query?: TRequestQuery;
    payloadIsError?: (data: any) => boolean;
    /**
     * Choose to make or not initial connection.
     * Method `.connect` must be called on returned `TweetStream` object
     * to start stream if `autoConnect` is set to `false`.
     * Defaults to `true`.
     */
    autoConnect?: boolean;
};
export declare type TStreamClientRequestArgsWithAutoConnect = TStreamClientRequestArgs & {
    autoConnect?: true;
};
export declare type TStreamClientRequestArgsWithoutAutoConnect = TStreamClientRequestArgs & {
    autoConnect: false;
};
/**
 * Base class for Twitter instances
 */
export default abstract class TwitterApiBase {
    protected _prefix: string | undefined;
    protected _currentUser: SharedPromise<UserV1> | null;
    protected _currentUserV2: SharedPromise<UserV2Result> | null;
    protected _requestMaker: ClientRequestMaker;
    /**
     * Create a new TwitterApi object without authentication.
     */
    constructor(_?: undefined, settings?: Partial<IClientSettings>);
    /**
     * Create a new TwitterApi object with OAuth 2.0 Bearer authentication.
     */
    constructor(bearerToken: string, settings?: Partial<IClientSettings>);
    /**
     * Create a new TwitterApi object with three-legged OAuth 1.0a authentication.
     */
    constructor(tokens: TwitterApiTokens, settings?: Partial<IClientSettings>);
    /**
     * Create a new TwitterApi object with only client ID needed for OAuth2 user-flow.
     */
    constructor(oauth2Init: TwitterApiOAuth2Init, settings?: Partial<IClientSettings>);
    /**
     * Create a new TwitterApi object with Basic HTTP authentication.
     */
    constructor(credentials: TwitterApiBasicAuth, settings?: Partial<IClientSettings>);
    /**
     * Create a clone of {instance}.
     */
    constructor(instance: TwitterApiBase, settings?: Partial<IClientSettings>);
    protected setPrefix(prefix: string | undefined): void;
    cloneWithPrefix(prefix: string): this;
    getActiveTokens(): import("./types").TClientTokens;
    getPlugins(): ITwitterApiClientPlugin[];
    getPluginOfType<T extends ITwitterApiClientPlugin>(type: {
        new (...args: any[]): T;
    }): T | undefined;
    /**
     * @deprecated - Migrate to plugin `@twitter-api-v2/plugin-rate-limit`
     *
     * Tells if you hit the Twitter rate limit for {endpoint}.
     * (local data only, this should not ask anything to Twitter)
     */
    hasHitRateLimit(endpoint: string): boolean;
    /**
     * @deprecated - Migrate to plugin `@twitter-api-v2/plugin-rate-limit`
     *
     * Tells if you hit the returned Twitter rate limit for {endpoint} has expired.
     * If client has no saved rate limit data for {endpoint}, this will gives you `true`.
     */
    isRateLimitStatusObsolete(endpoint: string): boolean;
    /**
     * @deprecated - Migrate to plugin `@twitter-api-v2/plugin-rate-limit`
     *
     * Get the last obtained Twitter rate limit information for {endpoint}.
     * (local data only, this should not ask anything to Twitter)
     */
    getLastRateLimitStatus(endpoint: string): TwitterRateLimit | undefined;
    /** Get cached current user. */
    protected getCurrentUserObject(forceFetch?: boolean): Promise<UserV1>;
    /**
     * Get cached current user from v2 API.
     * This can only be the slimest available `UserV2` object, with only `id`, `name` and `username` properties defined.
     *
     * To get a customized `UserV2Result`, use `.v2.me()`
     *
     * OAuth2 scopes: `tweet.read` & `users.read`
     */
    protected getCurrentUserV2Object(forceFetch?: boolean): Promise<UserV2Result>;
    get<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsDataResponse): Promise<T>;
    get<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsFullResponse): Promise<TwitterResponse<T>>;
    delete<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsDataResponse): Promise<T>;
    delete<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsFullResponse): Promise<TwitterResponse<T>>;
    post<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsDataResponse): Promise<T>;
    post<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsFullResponse): Promise<TwitterResponse<T>>;
    put<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsDataResponse): Promise<T>;
    put<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsFullResponse): Promise<TwitterResponse<T>>;
    patch<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsDataResponse): Promise<T>;
    patch<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsFullResponse): Promise<TwitterResponse<T>>;
    /** Stream request helpers */
    getStream<T = any>(url: string, query: TRequestQuery | undefined, options: TStreamClientRequestArgsWithoutAutoConnect): TweetStream<T>;
    getStream<T = any>(url: string, query?: TRequestQuery, options?: TStreamClientRequestArgsWithAutoConnect): Promise<TweetStream<T>>;
    getStream<T = any>(url: string, query?: TRequestQuery, options?: TStreamClientRequestArgs): Promise<TweetStream<T>> | TweetStream<T>;
    postStream<T = any>(url: string, body: TRequestBody | undefined, options: TStreamClientRequestArgsWithoutAutoConnect): TweetStream<T>;
    postStream<T = any>(url: string, body?: TRequestBody, options?: TStreamClientRequestArgsWithAutoConnect): Promise<TweetStream<T>>;
    postStream<T = any>(url: string, body?: TRequestBody, options?: TStreamClientRequestArgs): Promise<TweetStream<T>> | TweetStream<T>;
}
export {};
