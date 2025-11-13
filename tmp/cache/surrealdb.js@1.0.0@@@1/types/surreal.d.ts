import { PreparedQuery } from "./library/PreparedQuery.js";
import { EngineEvents } from "./library/engine.js";
import { Engine } from "./library/engine.js";
import { RecordId as _RecordId, StringRecordId } from "./library/cbor/recordid.js";
import { Emitter } from "./library/emitter.js";
import type { UUID } from "./library/cbor/uuid.js";
import { type ActionResult, AnyAuth, type ConnectionOptions, LiveHandler, type MapQueryResult, type Patch, Prettify, ScopeAuth, Token } from "./types.js";
import { ConnectionStatus } from "./library/engine.js";
type Engines = Record<string, new (emitter: Emitter<EngineEvents>) => Engine>;
type R = Prettify<Record<string, unknown>>;
type RecordId<Tb extends string = string> = _RecordId<Tb> | StringRecordId;
export declare class Surreal {
    connection: Engine | undefined;
    private pinger?;
    ready?: Promise<void>;
    emitter: Emitter<EngineEvents>;
    protected engines: Engines;
    constructor({ engines, }?: {
        engines?: Engines;
    });
    /**
     * Establish a socket connection to the database
     * @param connection - Connection details
     */
    connect(url: string | URL, opts?: ConnectionOptions): Promise<void>;
    /**
     * Disconnect the socket to the database
     */
    close(): Promise<void>;
    private clean;
    /**
     * Check if connection is ready
     */
    get status(): ConnectionStatus | undefined;
    /**
     * Ping SurrealDB instance
     */
    ping(): Promise<void>;
    /**
     * Switch to a specific namespace and database.
     * @param database - Switches to a specific namespace.
     * @param db - Switches to a specific database.
     */
    use({ namespace, database, }: {
        namespace?: string;
        database?: string;
    }): Promise<void>;
    /**
     * Selects everything from the [$auth](https://surrealdb.com/docs/surrealql/parameters) variable.
     * ```sql
     * SELECT * FROM $auth;
     * ```
     * Make sure the user actually has the permission to select their own record, otherwise you'll get back an empty result.
     * @return The record linked to the record ID used for authentication
     */
    info<T extends R>(): Promise<ActionResult<T> | undefined>;
    /**
     * Signs up to a specific authentication scope.
     * @param vars - Variables used in a signup query.
     * @return The authentication token.
     */
    signup(vars: ScopeAuth): Promise<string>;
    /**
     * Signs in to a specific authentication scope.
     * @param vars - Variables used in a signin query.
     * @return The authentication token.
     */
    signin(vars: AnyAuth): Promise<string>;
    /**
     * Authenticates the current connection with a JWT token.
     * @param token - The JWT authentication token.
     */
    authenticate(token: Token): Promise<boolean>;
    /**
     * Invalidates the authentication for the current connection.
     */
    invalidate(): Promise<boolean>;
    /**
     * Specify a variable for the current socket connection.
     * @param key - Specifies the name of the variable.
     * @param val - Assigns the value to the variable name.
     */
    let(variable: string, value: unknown): Promise<boolean>;
    /**
     * Remove a variable from the current socket connection.
     * @param key - Specifies the name of the variable.
     */
    unset(variable: string): Promise<void>;
    /**
     * Start a live query and listen for the responses
     * @param table - The table that you want to receive live results for.
     * @param callback - Callback function that receives updates.
     * @param diff - If set to true, will return a set of patches instead of complete records
     */
    live<Result extends Record<string, unknown> | Patch = Record<string, unknown>>(table: string, callback?: LiveHandler<Result>, diff?: boolean): Promise<UUID>;
    /**
     * Listen for live query responses by it's uuid
     * @param queryUuid - The LQ uuid that you want to receive live results for.
     * @param callback - Callback function that receives updates.
     */
    subscribeLive<Result extends Record<string, unknown> | Patch = Record<string, unknown>>(queryUuid: UUID, callback: LiveHandler<Result>): Promise<void>;
    /**
     * Listen for live query responses by it's uuid
     * @param queryUuid - The LQ uuid that you want to receive live results for.
     * @param callback - Callback function that receives updates.
     */
    unSubscribeLive<Result extends Record<string, unknown> | Patch = Record<string, unknown>>(queryUuid: UUID, callback: LiveHandler<Result>): Promise<void>;
    /**
     * Kill a live query
     * @param queryUuid - The query that you want to kill.
     */
    kill(queryUuid: UUID | readonly UUID[]): Promise<void>;
    /**
     * Runs a set of SurrealQL statements against the database.
     * @param query - Specifies the SurrealQL statements.
     * @param bindings - Assigns variables which can be used in the query.
     */
    query<T extends unknown[]>(query: string | PreparedQuery, bindings?: Record<string, unknown>): Promise<T>;
    /**
     * Runs a set of SurrealQL statements against the database.
     * @param query - Specifies the SurrealQL statements.
     * @param bindings - Assigns variables which can be used in the query.
     */
    query_raw<T extends unknown[]>(query: string | PreparedQuery, bindings?: Record<string, unknown>): Promise<MapQueryResult<T>>;
    /**
     * Selects all records in a table, or a specific record, from the database.
     * @param thing - The table name or a record ID to select.
     */
    select<T extends R>(thing: string): Promise<ActionResult<T>[]>;
    select<T extends R>(thing: RecordId): Promise<ActionResult<T>>;
    /**
     * Creates a record in the database.
     * @param thing - The table name or the specific record ID to create.
     * @param data - The document / record data to insert.
     */
    create<T extends R, U extends R = T>(thing: string, data?: U): Promise<ActionResult<T>[]>;
    create<T extends R, U extends R = T>(thing: RecordId, data?: U): Promise<ActionResult<T>>;
    /**
     * Inserts one or multiple records in the database.
     * @param thing - The table name or the specific record ID to create.
     * @param data - The document(s) / record(s) to insert.
     */
    insert<T extends R, U extends R = T>(thing: string, data?: U | U[]): Promise<ActionResult<T>[]>;
    insert<T extends R, U extends R = T>(thing: RecordId, data?: U): Promise<ActionResult<T>>;
    /**
     * Updates all records in a table, or a specific record, in the database.
     *
     * ***NOTE: This function replaces the current document / record data with the specified data.***
     * @param thing - The table name or the specific record ID to update.
     * @param data - The document / record data to insert.
     */
    update<T extends R, U extends R = T>(thing: string, data?: U): Promise<ActionResult<T>[]>;
    update<T extends R, U extends R = T>(thing: RecordId, data?: U): Promise<ActionResult<T>>;
    /**
     * Modifies all records in a table, or a specific record, in the database.
     *
     * ***NOTE: This function merges the current document / record data with the specified data.***
     * @param thing - The table name or the specific record ID to change.
     * @param data - The document / record data to insert.
     */
    merge<T extends R, U extends R = Partial<T>>(thing: string, data?: U): Promise<ActionResult<T>[]>;
    merge<T extends R, U extends R = Partial<T>>(thing: RecordId, data?: U): Promise<ActionResult<T>>;
    /**
     * Applies JSON Patch changes to all records, or a specific record, in the database.
     *
     * ***NOTE: This function patches the current document / record data with the specified JSON Patch data.***
     * @param thing - The table name or the specific record ID to modify.
     * @param data - The JSON Patch data with which to modify the records.
     */
    patch<T extends R>(thing: RecordId, data?: Patch[], diff?: false): Promise<ActionResult<T>>;
    patch<T extends R>(thing: string, data?: Patch[], diff?: false): Promise<ActionResult<T>[]>;
    patch<T extends R>(thing: RecordId, data: undefined | Patch[], diff: true): Promise<Patch[]>;
    patch<T extends R>(thing: string, data: undefined | Patch[], diff: true): Promise<Patch[][]>;
    /**
     * Deletes all records in a table, or a specific record, from the database.
     * @param thing - The table name or a record ID to select.
     */
    delete<T extends R>(thing: string): Promise<ActionResult<T>[]>;
    delete<T extends R>(thing: RecordId): Promise<ActionResult<T>>;
    /**
     * Obtain the version of the SurrealDB instance
     */
    version(): Promise<string>;
    /**
     * Run a SurrealQL function
     * @param name - The full name of the function
     * @param args - The arguments supplied to the function. You can also supply a version here as a string, in which case the third argument becomes the parameter list.
     */
    run<T extends unknown>(name: string, args?: unknown[]): Promise<T>;
    /**
     * Run a SurrealQL function
     * @param name - The full name of the function
     * @param version - The version of the function. If omitted, the second argument is the parameter list.
     * @param args - The arguments supplied to the function.
     */
    run<T extends unknown>(name: string, version: string, args?: unknown[]): Promise<T>;
    /**
     * Obtain the version of the SurrealDB instance
     * @param from - The in property on the edge record
     * @param thing - The id of the edge record
     * @param to - The out property on the edge record
     * @param data - Optionally, provide a body for the edge record
     */
    relate<T extends R, U extends R = T>(from: string | RecordId | RecordId[], thing: string, to: string | RecordId | RecordId[], data?: U): Promise<T[]>;
    relate<T extends R, U extends R = T>(from: string | RecordId | RecordId[], thing: RecordId, to: string | RecordId | RecordId[], data?: U): Promise<T>;
    /**
     * Send a raw message to the SurrealDB instance
     * @param method - Type of message to send.
     * @param params - Parameters for the message.
     */
    protected rpc<Result extends unknown>(method: string, params?: unknown[]): Promise<import("./types.js").RpcResponse<Result>>;
}
export {};
