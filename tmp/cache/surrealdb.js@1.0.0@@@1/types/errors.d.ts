export declare class SurrealDbError extends Error {
}
export declare class NoActiveSocket extends SurrealDbError {
    name: string;
    message: string;
}
export declare class NoConnectionDetails extends SurrealDbError {
    name: string;
    message: string;
}
export declare class UnexpectedResponse extends SurrealDbError {
    name: string;
    message: string;
}
export declare class InvalidURLProvided extends SurrealDbError {
    name: string;
    message: string;
}
export declare class EngineDisconnected extends SurrealDbError {
    name: string;
    message: string;
}
export declare class UnexpectedServerResponse extends SurrealDbError {
    readonly response: unknown;
    name: string;
    constructor(response: unknown);
}
export declare class UnexpectedConnectionError extends SurrealDbError {
    readonly error: unknown;
    name: string;
    constructor(error: unknown);
}
export declare class UnsupportedEngine extends SurrealDbError {
    readonly engine: string;
    name: string;
    message: string;
    constructor(engine: string);
}
export declare class ConnectionUnavailable extends SurrealDbError {
    name: string;
    message: string;
}
export declare class MissingNamespaceDatabase extends SurrealDbError {
    name: string;
    message: string;
}
export declare class HttpConnectionError extends SurrealDbError {
    readonly message: string;
    readonly status: number;
    readonly statusText: string;
    readonly buffer: ArrayBuffer;
    name: string;
    constructor(message: string, status: number, statusText: string, buffer: ArrayBuffer);
}
export declare class ResponseError extends SurrealDbError {
    readonly message: string;
    name: string;
    constructor(message: string);
}
export declare class NoNamespaceSpecified extends SurrealDbError {
    name: string;
    message: string;
}
export declare class NoDatabaseSpecified extends SurrealDbError {
    name: string;
    message: string;
}
export declare class NoTokenReturned extends SurrealDbError {
    name: string;
    message: string;
}
export declare class UnsupportedVersion extends SurrealDbError {
    name: string;
    version: string;
    supportedRange: string;
    constructor(version: string, supportedRange: string);
}
export declare class VersionRetrievalFailure extends SurrealDbError {
    name: string;
    message: string;
}
