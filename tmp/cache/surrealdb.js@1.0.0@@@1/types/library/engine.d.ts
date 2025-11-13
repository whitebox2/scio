import { Emitter } from "./emitter.js";
import { Action, Patch, RpcRequest, RpcResponse } from "../types.js";
import { EngineDisconnected } from "../errors.js";
export type EngineEvents = {
    connecting: [];
    connected: [];
    disconnected: [];
    error: [Error];
    [K: `rpc-${string | number}`]: [RpcResponse | EngineDisconnected];
    [K: `live-${string}`]: [Action, Record<string, unknown> | Patch];
};
export declare enum ConnectionStatus {
    Disconnected = "disconnected",
    Connecting = "connecting",
    Connected = "connected",
    Error = "error"
}
export declare abstract class Engine {
    constructor(...[_]: [emitter: Emitter<EngineEvents>]);
    abstract emitter: Emitter<EngineEvents>;
    abstract ready: Promise<void> | undefined;
    abstract status: ConnectionStatus;
    abstract connect(url: URL): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract rpc<Method extends string, Params extends unknown[] | undefined, Result extends unknown>(request: RpcRequest<Method, Params>): Promise<RpcResponse<Result>>;
    abstract connection: {
        url?: URL;
        namespace?: string;
        database?: string;
        token?: string;
    };
    abstract version(url: URL, timeout: number): Promise<string>;
}
export declare class WebsocketEngine implements Engine {
    ready: Promise<void> | undefined;
    status: ConnectionStatus;
    connection: {
        url?: URL;
        namespace?: string;
        database?: string;
        token?: string;
    };
    readonly emitter: Emitter<EngineEvents>;
    private socket?;
    constructor(emitter: Emitter<EngineEvents>);
    private setStatus;
    private requireStatus;
    version(url: URL, timeout: number): Promise<string>;
    connect(url: URL): Promise<void>;
    disconnect(): Promise<void>;
    rpc<Method extends string, Params extends unknown[] | undefined, Result extends unknown>(request: RpcRequest<Method, Params>): Promise<RpcResponse<Result>>;
    handleRpcResponse({ id, ...res }: any): void;
    get connected(): boolean;
}
export declare class HttpEngine implements Engine {
    ready: Promise<void> | undefined;
    status: ConnectionStatus;
    readonly emitter: Emitter<EngineEvents>;
    connection: {
        url?: URL;
        namespace?: string;
        database?: string;
        token?: string;
        variables: Record<string, unknown>;
    };
    constructor(emitter: Emitter<EngineEvents>);
    private setStatus;
    version(url: URL, timeout: number): Promise<string>;
    connect(url: URL): Promise<void>;
    disconnect(): Promise<void>;
    rpc<Method extends string, Params extends unknown[] | undefined, Result extends unknown>(request: RpcRequest<Method, Params>): Promise<RpcResponse<Result>>;
    get connected(): boolean;
}
