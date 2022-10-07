import { TwitterApi } from '..';
/** User OAuth 1.0a client */
export declare function getUserClient(this: any): TwitterApi;
export declare function getUserKeys(): {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
};
export declare function sleepTest(ms: number): Promise<unknown>;
/** User-unlogged OAuth 1.0a client */
export declare function getRequestClient(): TwitterApi;
export declare function getRequestKeys(): {
    appKey: string;
    appSecret: string;
};
export declare function getAuthLink(callback: string): Promise<{
    oauth_token: string;
    oauth_token_secret: string;
    oauth_callback_confirmed: "true";
    url: string;
}>;
export declare function getAccessClient(verifier: string): Promise<TwitterApi>;
/** App OAuth 2.0 client */
export declare function getAppClient(): Promise<TwitterApi>;
