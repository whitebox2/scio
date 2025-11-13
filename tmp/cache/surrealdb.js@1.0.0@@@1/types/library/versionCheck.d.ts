export declare const supportedSurrealDbVersionRange = ">= 2.3.0";
export declare function versionCheck(version: string): true;
export declare function isVersionSupported(version: string): boolean;
export declare function retrieveRemoteVersion(url: URL, timeout: number): Promise<string>;
