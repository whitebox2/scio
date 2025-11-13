"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Surreal = void 0;
const errors_js_1 = require("./errors.js");
const Pinger_js_1 = require("./library/Pinger.js");
const engine_js_1 = require("./library/engine.js");
const emitter_js_1 = require("./library/emitter.js");
const processAuthVars_js_1 = require("./library/processAuthVars.js");
const types_js_1 = require("./types.js");
const engine_js_2 = require("./library/engine.js");
const versionCheck_js_1 = require("./library/versionCheck.js");
class Surreal {
    constructor({ engines, } = {}) {
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pinger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ready", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "emitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "engines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                ws: engine_js_1.WebsocketEngine,
                wss: engine_js_1.WebsocketEngine,
                http: engine_js_1.HttpEngine,
                https: engine_js_1.HttpEngine,
            }
        });
        this.emitter = new emitter_js_1.Emitter();
        this.emitter.subscribe(engine_js_2.ConnectionStatus.Disconnected, () => this.clean());
        this.emitter.subscribe(engine_js_2.ConnectionStatus.Error, () => this.close());
        if (engines) {
            this.engines = {
                ...this.engines,
                ...engines,
            };
        }
    }
    /**
     * Establish a socket connection to the database
     * @param connection - Connection details
     */
    async connect(url, opts = {}) {
        url = new URL(url);
        if (!url.pathname.endsWith("/rpc")) {
            if (!url.pathname.endsWith("/"))
                url.pathname += "/";
            url.pathname += "rpc";
        }
        const engineName = url.protocol.slice(0, -1);
        const engine = this.engines[engineName];
        if (!engine)
            throw new errors_js_1.UnsupportedEngine(engineName);
        const { prepare, auth, namespace, database } = (0, types_js_1.processConnectionOptions)(opts);
        // Close any existing connections
        await this.close();
        // The promise does not know if `this.connection` is undefined or not, but it does about `connection`
        const connection = new engine(this.emitter);
        // If not disabled, run a version check
        if (opts.versionCheck !== false) {
            const version = await connection.version(url, opts.versionCheckTimeout ?? 5000);
            (0, versionCheck_js_1.versionCheck)(version);
        }
        this.connection = connection;
        this.pinger = new Pinger_js_1.Pinger(30000);
        this.ready = new Promise((resolve, reject) => connection.connect(url)
            .then(async () => {
            this.pinger?.start(() => this.ping());
            if (namespace || database) {
                await this.use({
                    namespace,
                    database,
                });
            }
            if (typeof auth === "string") {
                await this.authenticate(auth);
            }
            else if (auth) {
                await this.signin(auth);
            }
            await prepare?.(this);
            resolve();
        })
            .catch(reject));
        return this.ready;
    }
    /**
     * Disconnect the socket to the database
     */
    async close() {
        this.clean();
        await this.connection?.disconnect();
    }
    clean() {
        this.pinger?.stop();
        // Scan all pending rpc requests
        const pending = this.emitter.scanListeners((k) => k.startsWith("rpc-"));
        // Ensure all rpc requests get a connection closed response
        pending.map((k) => this.emitter.emit(k, [new errors_js_1.EngineDisconnected()]));
        // Cleanup subscriptions and yet to be collected emisions
        this.emitter.reset({
            collectable: true,
            listeners: pending,
        });
    }
    /**
     * Check if connection is ready
     */
    get status() {
        return this.connection?.status;
    }
    /**
     * Ping SurrealDB instance
     */
    async ping() {
        const { error } = await this.rpc("ping");
        if (error)
            throw new errors_js_1.ResponseError(error.message);
    }
    /**
     * Switch to a specific namespace and database.
     * @param database - Switches to a specific namespace.
     * @param db - Switches to a specific database.
     */
    async use({ namespace, database, }) {
        if (!this.connection)
            throw new errors_js_1.NoActiveSocket();
        if (!namespace && !this.connection.connection.namespace) {
            throw new errors_js_1.NoNamespaceSpecified();
        }
        if (!database && !this.connection.connection.database) {
            throw new errors_js_1.NoDatabaseSpecified();
        }
        const { error } = await this.rpc("use", [
            namespace ?? this.connection.connection.namespace,
            database ?? this.connection.connection.database,
        ]);
        if (error)
            throw new errors_js_1.ResponseError(error.message);
    }
    /**
     * Selects everything from the [$auth](https://surrealdb.com/docs/surrealql/parameters) variable.
     * ```sql
     * SELECT * FROM $auth;
     * ```
     * Make sure the user actually has the permission to select their own record, otherwise you'll get back an empty result.
     * @return The record linked to the record ID used for authentication
     */
    async info() {
        await this.ready;
        const res = await this.rpc("info");
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result ?? undefined;
    }
    /**
     * Signs up to a specific authentication scope.
     * @param vars - Variables used in a signup query.
     * @return The authentication token.
     */
    async signup(vars) {
        if (!this.connection)
            throw new errors_js_1.NoActiveSocket();
        vars = types_js_1.ScopeAuth.parse(vars);
        vars = (0, processAuthVars_js_1.processAuthVars)(vars, this.connection.connection);
        const res = await this.rpc("signup", [
            types_js_1.TransformAuth.parse(vars),
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        if (!res.result) {
            throw new errors_js_1.NoTokenReturned();
        }
        return res.result;
    }
    /**
     * Signs in to a specific authentication scope.
     * @param vars - Variables used in a signin query.
     * @return The authentication token.
     */
    async signin(vars) {
        if (!this.connection)
            throw new errors_js_1.NoActiveSocket();
        vars = types_js_1.AnyAuth.parse(vars);
        vars = (0, processAuthVars_js_1.processAuthVars)(vars, this.connection.connection);
        const res = await this.rpc("signin", [
            types_js_1.TransformAuth.parse(vars),
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        if (!res.result) {
            throw new errors_js_1.NoTokenReturned();
        }
        return res.result;
    }
    /**
     * Authenticates the current connection with a JWT token.
     * @param token - The JWT authentication token.
     */
    async authenticate(token) {
        const res = await this.rpc("authenticate", [
            types_js_1.Token.parse(token),
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return true;
    }
    /**
     * Invalidates the authentication for the current connection.
     */
    async invalidate() {
        const res = await this.rpc("invalidate");
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return true;
    }
    /**
     * Specify a variable for the current socket connection.
     * @param key - Specifies the name of the variable.
     * @param val - Assigns the value to the variable name.
     */
    async let(variable, value) {
        const res = await this.rpc("let", [variable, value]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return true;
    }
    /**
     * Remove a variable from the current socket connection.
     * @param key - Specifies the name of the variable.
     */
    async unset(variable) {
        const res = await this.rpc("unset", [variable]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
    }
    /**
     * Start a live query and listen for the responses
     * @param table - The table that you want to receive live results for.
     * @param callback - Callback function that receives updates.
     * @param diff - If set to true, will return a set of patches instead of complete records
     */
    async live(table, callback, diff) {
        await this.ready;
        const res = await this.rpc("live", [table, diff]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        if (callback)
            this.subscribeLive(res.result, callback);
        return res.result;
    }
    /**
     * Listen for live query responses by it's uuid
     * @param queryUuid - The LQ uuid that you want to receive live results for.
     * @param callback - Callback function that receives updates.
     */
    async subscribeLive(queryUuid, callback) {
        await this.ready;
        if (!this.connection)
            throw new errors_js_1.NoActiveSocket();
        this.connection.emitter.subscribe(`live-${queryUuid}`, callback, true);
    }
    /**
     * Listen for live query responses by it's uuid
     * @param queryUuid - The LQ uuid that you want to receive live results for.
     * @param callback - Callback function that receives updates.
     */
    async unSubscribeLive(queryUuid, callback) {
        await this.ready;
        if (!this.connection)
            throw new errors_js_1.NoActiveSocket();
        this.connection.emitter.unSubscribe(`live-${queryUuid}`, callback);
    }
    /**
     * Kill a live query
     * @param queryUuid - The query that you want to kill.
     */
    async kill(queryUuid) {
        await this.ready;
        if (!this.connection)
            throw new errors_js_1.NoActiveSocket();
        if (Array.isArray(queryUuid)) {
            await Promise.all(queryUuid.map((u) => this.rpc("kill", [u])));
            const toBeKilled = queryUuid.map((u) => `live-${u}`);
            this.connection.emitter.reset({
                collectable: toBeKilled,
                listeners: toBeKilled,
            });
        }
        else {
            await this.rpc("kill", [queryUuid]);
            this.connection.emitter.reset({
                collectable: `live-${queryUuid}`,
                listeners: `live-${queryUuid}`,
            });
        }
    }
    /**
     * Runs a set of SurrealQL statements against the database.
     * @param query - Specifies the SurrealQL statements.
     * @param bindings - Assigns variables which can be used in the query.
     */
    async query(query, bindings) {
        const raw = await this.query_raw(query, bindings);
        return raw.map(({ status, result }) => {
            if (status == "ERR")
                throw new errors_js_1.ResponseError(result);
            return result;
        });
    }
    /**
     * Runs a set of SurrealQL statements against the database.
     * @param query - Specifies the SurrealQL statements.
     * @param bindings - Assigns variables which can be used in the query.
     */
    async query_raw(query, bindings) {
        if (typeof query !== "string") {
            bindings = bindings ?? {};
            bindings = { ...bindings, ...query.bindings };
            query = query.query;
        }
        await this.ready;
        const res = await this.rpc("query", [
            query,
            bindings,
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async select(thing) {
        await this.ready;
        const res = await this.rpc("select", [thing]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async create(thing, data) {
        await this.ready;
        const res = await this.rpc("create", [
            thing,
            data,
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async insert(thing, data) {
        await this.ready;
        const res = await this.rpc("insert", [
            thing,
            data,
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async update(thing, data) {
        await this.ready;
        const res = await this.rpc("update", [
            thing,
            data,
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async merge(thing, data) {
        await this.ready;
        const res = await this.rpc("merge", [
            thing,
            data,
        ]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async patch(thing, data, diff) {
        await this.ready;
        // deno-lint-ignore no-explicit-any
        const res = await this.rpc("patch", [thing, data, diff]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async delete(thing) {
        await this.ready;
        const res = await this.rpc("delete", [thing]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    /**
     * Obtain the version of the SurrealDB instance
     */
    async version() {
        await this.ready;
        const res = await this.rpc("version");
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async run(name, arg2, arg3) {
        await this.ready;
        const [version, args] = Array.isArray(arg2)
            ? [undefined, arg2]
            : [arg2, arg3];
        const res = await this.rpc("run", [name, version, args]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    async relate(from, thing, to, data) {
        await this.ready;
        const res = await this.rpc("relate", [from, thing, to, data]);
        if (res.error)
            throw new errors_js_1.ResponseError(res.error.message);
        return res.result;
    }
    /**
     * Send a raw message to the SurrealDB instance
     * @param method - Type of message to send.
     * @param params - Parameters for the message.
     */
    rpc(method, params) {
        if (!this.connection)
            throw new errors_js_1.NoActiveSocket();
        return this.connection.rpc({
            method,
            params,
        });
    }
}
exports.Surreal = Surreal;
//# sourceMappingURL=surreal.js.map