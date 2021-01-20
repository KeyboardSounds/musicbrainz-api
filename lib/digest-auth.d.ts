export interface ICredentials {
    username: string;
    password: string;
}
export declare class DigestAuth {
    private credentials;
    /**
     * RFC 2617: handle both MD5 and MD5-sess algorithms.
     *
     * If the algorithm directive's value is "MD5" or unspecified, then HA1 is
     *   HA1=MD5(username:realm:password)
     * If the algorithm directive's value is "MD5-sess", then HA1 is
     *   HA1=MD5(MD5(username:realm:password):nonce:cnonce)
     */
    static ha1Compute(algorithm: any, user: any, realm: any, pass: any, nonce: any, cnonce: any): string;
    hasAuth: boolean;
    sentAuth: boolean;
    bearerToken: string;
    constructor(credentials: ICredentials);
    digest(method: string, path: string, authHeader: string): string;
}
