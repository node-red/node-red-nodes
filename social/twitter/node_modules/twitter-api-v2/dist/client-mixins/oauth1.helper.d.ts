export interface OAuth1Tokens {
    key: string;
    secret: string;
}
export interface OAuth1MakerArgs {
    consumerKeys: OAuth1Tokens;
}
export interface OAuth1RequestOptions {
    url: string;
    method: string;
    data?: any;
}
export interface OAuth1AuthInfo {
    oauth_consumer_key: string;
    oauth_nonce: string;
    oauth_signature_method: string;
    oauth_timestamp: number;
    oauth_version: string;
    oauth_token: string;
    oauth_signature: string;
}
export declare class OAuth1Helper {
    nonceLength: number;
    protected consumerKeys: OAuth1Tokens;
    constructor(options: OAuth1MakerArgs);
    static percentEncode(str: string): string;
    protected hash(base: string, key: string): string;
    authorize(request: OAuth1RequestOptions, accessTokens?: Partial<OAuth1Tokens>): OAuth1AuthInfo;
    toHeader(oauthInfo: OAuth1AuthInfo): {
        Authorization: string;
    };
    protected getNonce(): string;
    protected getTimestamp(): number;
    protected getSignature(request: OAuth1RequestOptions, tokenSecret: string | undefined, oauthInfo: OAuth1AuthInfo): string;
    protected getSigningKey(tokenSecret: string | undefined): string;
    protected getBaseString(request: OAuth1RequestOptions, oauthInfo: OAuth1AuthInfo): string;
    protected getParameterString(request: OAuth1RequestOptions, oauthInfo: OAuth1AuthInfo): string;
    protected getBaseUrl(url: string): string;
}
export default OAuth1Helper;
