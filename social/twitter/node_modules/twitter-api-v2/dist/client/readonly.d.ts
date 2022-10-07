import TwitterApi from '.';
import TwitterApiBase from '../client.base';
import { AccessOAuth2TokenArgs, AccessOAuth2TokenResult, BuildOAuth2RequestLinkArgs, IOAuth2RequestTokenResult, IParsedOAuth2TokenResult, LoginResult, RequestTokenArgs, Tweetv2SearchParams } from '../types';
import TwitterApiv1ReadOnly from '../v1/client.v1.read';
import TwitterApiv2ReadOnly from '../v2/client.v2.read';
/**
 * Twitter v1.1 and v2 API client.
 */
export default class TwitterApiReadOnly extends TwitterApiBase {
    protected _v1?: TwitterApiv1ReadOnly;
    protected _v2?: TwitterApiv2ReadOnly;
    get v1(): TwitterApiv1ReadOnly;
    get v2(): TwitterApiv2ReadOnly;
    /**
     * Fetch and cache current user.
     * This method can only be called with a OAuth 1.0a user authentication.
     *
     * You can use this method to test if authentication was successful.
     * Next calls to this methods will use the cached user, unless `forceFetch: true` is given.
     */
    currentUser(forceFetch?: boolean): Promise<import("../types").UserV1>;
    /**
     * Fetch and cache current user.
     * This method can only be called with a OAuth 1.0a or OAuth2 user authentication.
     *
     * This can only be the slimest available `UserV2` object, with only id, name and username properties defined.
     * To get a customized `UserV2Result`, use `.v2.me()`
     *
     * You can use this method to test if authentication was successful.
     * Next calls to this methods will use the cached user, unless `forceFetch: true` is given.
     *
     * OAuth2 scopes: `tweet.read` & `users.read`
     */
    currentUserV2(forceFetch?: boolean): Promise<import("../types").UserV2Result>;
    search(what: string, options?: Partial<Tweetv2SearchParams>): Promise<import("..").TweetSearchRecentV2Paginator>;
    /**
     * Generate the OAuth request token link for user-based OAuth 1.0 auth.
     *
     * ```ts
     * // Instanciate TwitterApi with consumer keys
     * const client = new TwitterApi({ appKey: 'consumer_key', appSecret: 'consumer_secret' });
     *
     * const tokenRequest = await client.generateAuthLink('oob-or-your-callback-url');
     * // redirect end-user to tokenRequest.url
     *
     * // Save tokenRequest.oauth_token_secret somewhere, it will be needed for next auth step.
     * ```
     */
    generateAuthLink(oauth_callback?: string, { authAccessType, linkMode, forceLogin, screenName, }?: Partial<RequestTokenArgs>): Promise<{
        oauth_token: string;
        oauth_token_secret: string;
        oauth_callback_confirmed: "true";
        url: string;
    }>;
    /**
     * Obtain access to user-based OAuth 1.0 auth.
     *
     * After user is redirect from your callback, use obtained oauth_token and oauth_verifier to
     * instanciate the new TwitterApi instance.
     *
     * ```ts
     * // Use the saved oauth_token_secret associated to oauth_token returned by callback
     * const requestClient = new TwitterApi({
     *  appKey: 'consumer_key',
     *  appSecret: 'consumer_secret',
     *  accessToken: 'oauth_token',
     *  accessSecret: 'oauth_token_secret'
     * });
     *
     * // Use oauth_verifier obtained from callback request
     * const { client: userClient } = await requestClient.login('oauth_verifier');
     *
     * // {userClient} is a valid {TwitterApi} object you can use for future requests
     * ```
     */
    login(oauth_verifier: string): Promise<LoginResult>;
    /**
     * Enable application-only authentication.
     *
     * To make the request, instanciate TwitterApi with consumer and secret.
     *
     * ```ts
     * const requestClient = new TwitterApi({ appKey: 'consumer', appSecret: 'secret' });
     * const appClient = await requestClient.appLogin();
     *
     * // Use {appClient} to make requests
     * ```
     */
    appLogin(): Promise<TwitterApi>;
    /**
     * Generate the OAuth request token link for user-based OAuth 2.0 auth.
     *
     * - **You can only use v2 API endpoints with this authentication method.**
     * - **You need to specify which scope you want to have when you create your auth link. Make sure it matches your needs.**
     *
     * See https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token for details.
     *
     * ```ts
     * // Instanciate TwitterApi with client ID
     * const client = new TwitterApi({ clientId: 'yourClientId' });
     *
     * // Generate a link to callback URL that will gives a token with tweet+user read access
     * const link = client.generateOAuth2AuthLink('your-callback-url', { scope: ['tweet.read', 'users.read'] });
     *
     * // Extract props from generate link
     * const { url, state, codeVerifier } = link;
     *
     * // redirect end-user to url
     * // Save `state` and `codeVerifier` somewhere, it will be needed for next auth step.
     * ```
     */
    generateOAuth2AuthLink(redirectUri: string, options?: Partial<BuildOAuth2RequestLinkArgs>): IOAuth2RequestTokenResult;
    /**
     * Obtain access to user-based OAuth 2.0 auth.
     *
     * After user is redirect from your callback, use obtained code to
     * instanciate the new TwitterApi instance.
     *
     * You need to obtain `codeVerifier` from a call to `.generateOAuth2AuthLink`.
     *
     * ```ts
     * // Use the saved codeVerifier associated to state (present in query string of callback)
     * const requestClient = new TwitterApi({ clientId: 'yourClientId' });
     *
     * const { client: userClient, refreshToken } = await requestClient.loginWithOAuth2({
     *  code: 'codeFromQueryString',
     *  // the same URL given to generateOAuth2AuthLink
     *  redirectUri,
     *  // the verifier returned by generateOAuth2AuthLink
     *  codeVerifier,
     * });
     *
     * // {userClient} is a valid {TwitterApi} object you can use for future requests
     * // {refreshToken} is defined if 'offline.access' is in scope.
     * ```
     */
    loginWithOAuth2({ code, codeVerifier, redirectUri }: AccessOAuth2TokenArgs): Promise<IParsedOAuth2TokenResult>;
    /**
     * Obtain a new access token to user-based OAuth 2.0 auth from a refresh token.
     *
     * ```ts
     * const requestClient = new TwitterApi({ clientId: 'yourClientId' });
     *
     * const { client: userClient } = await requestClient.refreshOAuth2Token('refreshToken');
     * // {userClient} is a valid {TwitterApi} object you can use for future requests
     * ```
     */
    refreshOAuth2Token(refreshToken: string): Promise<IParsedOAuth2TokenResult>;
    /**
     * Revoke a single user-based OAuth 2.0 token.
     *
     * You must specify its source, access token (directly after login)
     * or refresh token (if you've called `.refreshOAuth2Token` before).
     */
    revokeOAuth2Token(token: string, tokenType?: 'access_token' | 'refresh_token'): Promise<void>;
    protected parseOAuth2AccessTokenResult(result: AccessOAuth2TokenResult): IParsedOAuth2TokenResult;
}
