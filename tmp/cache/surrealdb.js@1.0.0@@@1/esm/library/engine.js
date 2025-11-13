import { z } from "zod";
import { getIncrementalID } from "./getIncrementalID.js";
import WebSocket from "./WebSocket/node.js";
import { decodeCbor, encodeCbor } from "./cbor/index.js";
import { LiveResult, } from "../types.js";
import { ConnectionUnavailable, EngineDisconnected, HttpConnectionError, MissingNamespaceDatabase, ResponseError, UnexpectedConnectionError, UnexpectedServerResponse, } from "../errors.js";
import { retrieveRemoteVersion } from "./versionCheck.js";
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["Disconnected"] = "disconnected";
    ConnectionStatus["Connecting"] = "connecting";
    ConnectionStatus["Connected"] = "connected";
    ConnectionStatus["Error"] = "error";
})(ConnectionStatus || (ConnectionStatus = {}));
export class Engine {
    constructor(...[_]) { }
}
export class WebsocketEngine {
    constructor(emitter) {
        Object.defineProperty(this, "ready", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ConnectionStatus.Disconnected
        });
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "emitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.emitter = emitter;
    }
    setStatus(status, ...args) {
        this.status = status;
        this.emitter.emit(status, args);
    }
    async requireStatus(status) {
        if (this.status != status) {
            await this.emitter.subscribeOnce(status);
        }
        return true;
    }
    version(url, timeout) {
        return retrieveRemoteVersion(url, timeout);
    }
    async connect(url) {
        this.connection.url = url;
        this.setStatus(ConnectionStatus.Connecting);
        const socket = new WebSocket(url.toString(), "cbor");
        const ready = new Promise((resolve, reject) => {
            socket.addEventListener("open", () => {
                this.setStatus(ConnectionStatus.Connected);
                resolve();
            });
            socket.addEventListener("error", (e) => {
                const error = new UnexpectedConnectionError("error" in e ? e.error : "An unexpected error occurred");
                this.setStatus(ConnectionStatus.Error, error);
                reject(error);
            });
            socket.addEventListener("close", () => {
                this.setStatus(ConnectionStatus.Disconnected);
            });
            socket.addEventListener("message", async ({ data }) => {
                const decoded = decodeCbor(data instanceof Blob
                    ? await data.arrayBuffer()
                    : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                if (typeof decoded == "object" && !Array.isArray(decoded) &&
                    decoded != null) {
                    this.handleRpcResponse(decoded);
                }
                else {
                    this.setStatus(ConnectionStatus.Error, new UnexpectedServerResponse(decoded));
                }
            });
        });
        this.ready = ready;
        return await ready.then(() => {
            this.socket = socket;
        });
    }
    async disconnect() {
        this.connection = {};
        await this.ready?.catch(() => { });
        this.socket?.close();
        this.ready = undefined;
        this.socket = undefined;
        await Promise.any([
            this.requireStatus(ConnectionStatus.Disconnected),
            this.requireStatus(ConnectionStatus.Error),
        ]);
    }
    async rpc(request) {
        await this.ready;
        if (!this.socket)
            throw new ConnectionUnavailable();
        // It's not realistic for the message to ever arrive before the listener is registered on the emitter
        // And we don't want to collect the response messages in the emitter
        // So to be sure we simply subscribe before we send the message :)
        const id = getIncrementalID();
        const response = this.emitter.subscribeOnce(`rpc-${id}`);
        this.socket.send(encodeCbor({ id, ...request }));
        return response.then(([res]) => {
            if (res instanceof EngineDisconnected)
                throw res;
            if ("result" in res) {
                switch (request.method) {
                    case "use": {
                        this.connection.namespace = z.string().parse(request.params?.[0]);
                        this.connection.database = z.string().parse(request.params?.[1]);
                        break;
                    }
                    case "signin":
                    case "signup": {
                        this.connection.token = res.result;
                        break;
                    }
                    case "authenticate": {
                        this.connection.token = request.params?.[0];
                        break;
                    }
                    case "invalidate": {
                        delete this.connection.token;
                        break;
                    }
                }
            }
            return res;
        });
    }
    // deno-lint-ignore no-explicit-any
    handleRpcResponse({ id, ...res }) {
        if (id) {
            this.emitter.emit(`rpc-${id}`, [res]);
        }
        else if (res.error) {
            this.setStatus(ConnectionStatus.Error, new ResponseError(res.error));
        }
        else {
            const live = LiveResult.safeParse(res.result);
            if (live.success) {
                const { id, action, result } = live.data;
                this.emitter.emit(`live-${id}`, [action, result], true);
            }
            else {
                this.setStatus(ConnectionStatus.Error, new UnexpectedServerResponse({ id, ...res }));
            }
        }
    }
    get connected() {
        return !!this.socket;
    }
}
export class HttpEngine {
    constructor(emitter) {
        Object.defineProperty(this, "ready", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ConnectionStatus.Disconnected
        });
        Object.defineProperty(this, "emitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { variables: {} }
        });
        this.emitter = emitter;
    }
    setStatus(status, ...args) {
        this.status = status;
        this.emitter.emit(status, args);
    }
    version(url, timeout) {
        return retrieveRemoteVersion(url, timeout);
    }
    connect(url) {
        this.setStatus(ConnectionStatus.Connecting);
        this.connection.url = url;
        this.setStatus(ConnectionStatus.Connected);
        this.ready = new Promise((r) => r());
        return this.ready;
    }
    disconnect() {
        this.connection = { variables: {} };
        this.ready = undefined;
        this.setStatus(ConnectionStatus.Disconnected);
        return new Promise((r) => r());
    }
    async rpc(request) {
        await this.ready;
        if (!this.connection.url) {
            throw new ConnectionUnavailable();
        }
        if (request.method == "use") {
            const [namespace, database] = z.tuple([z.string(), z.string()])
                .parse(request.params);
            if (namespace)
                this.connection.namespace = namespace;
            if (database)
                this.connection.database = database;
            return {
                result: true,
            };
        }
        if (request.method == "let") {
            const [key, value] = z.tuple([z.string(), z.unknown()]).parse(request.params);
            this.connection.variables[key] = value;
            return {
                result: true,
            };
        }
        if (request.method == "unset") {
            const [key] = z.tuple([z.string()]).parse(request.params);
            delete this.connection.variables[key];
            return {
                result: true,
            };
        }
        if (request.method == "query") {
            request.params = [
                request.params?.[0],
                {
                    ...this.connection.variables,
                    ...(request.params?.[1] ?? {}),
                },
            ];
        }
        if (!this.connection.namespace || !this.connection.database) {
            throw new MissingNamespaceDatabase();
        }
        const id = getIncrementalID();
        const raw = await fetch(`${this.connection.url}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/cbor",
                Accept: "application/cbor",
                "Surreal-NS": this.connection.namespace,
                "Surreal-DB": this.connection.database,
                ...(this.connection.token
                    ? { Authorization: `Bearer ${this.connection.token}` }
                    : {}),
            },
            body: encodeCbor({ id, ...request }),
        });
        const buffer = await raw.arrayBuffer();
        if (raw.status == 200) {
            const response = decodeCbor(buffer);
            if ("result" in response) {
                switch (request.method) {
                    case "signin":
                    case "signup": {
                        this.connection.token = response.result;
                        break;
                    }
                    case "authenticate": {
                        this.connection.token = request.params?.[0];
                        break;
                    }
                    case "invalidate": {
                        delete this.connection.token;
                        break;
                    }
                }
            }
            this.emitter.emit(`rpc-${id}`, [response]);
            return response;
        }
        else {
            const dec = new TextDecoder("utf-8");
            throw new HttpConnectionError(dec.decode(buffer), raw.status, raw.statusText, buffer);
        }
    }
    get connected() {
        return !!this.connection.url;
    }
}
//# sourceMappingURL=engine.js.map