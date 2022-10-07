export declare class OAuth2Helper {
    static getCodeVerifier(): string;
    static getCodeChallengeFromVerifier(verifier: string): string;
    static getAuthHeader(clientId: string, clientSecret: string): string;
    static generateRandomString(length: number): string;
    private static escapeBase64Url;
}
