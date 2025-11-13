"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveResult = exports.Action = exports.processConnectionOptions = exports.TransformAuth = exports.Token = exports.AnyAuth = exports.ScopeAuth = exports.DatabaseAuth = exports.NamespaceAuth = exports.SuperUserAuth = exports.UseOptions = void 0;
const zod_1 = require("zod");
const uuid_js_1 = require("./library/cbor/uuid.js");
exports.UseOptions = zod_1.z.object({
    namespace: zod_1.z.coerce.string(),
    database: zod_1.z.coerce.string(),
});
//////////////////////////////////////////////
//////////   AUTHENTICATION TYPES   //////////
//////////////////////////////////////////////
exports.SuperUserAuth = zod_1.z.object({
    namespace: zod_1.z.never().optional(),
    database: zod_1.z.never().optional(),
    scope: zod_1.z.never().optional(),
    username: zod_1.z.coerce.string(),
    password: zod_1.z.coerce.string(),
});
exports.NamespaceAuth = zod_1.z.object({
    namespace: zod_1.z.coerce.string(),
    database: zod_1.z.never().optional(),
    scope: zod_1.z.never().optional(),
    username: zod_1.z.coerce.string(),
    password: zod_1.z.coerce.string(),
});
exports.DatabaseAuth = zod_1.z.object({
    namespace: zod_1.z.coerce.string(),
    database: zod_1.z.coerce.string(),
    scope: zod_1.z.never().optional(),
    username: zod_1.z.coerce.string(),
    password: zod_1.z.coerce.string(),
});
exports.ScopeAuth = zod_1.z.object({
    namespace: zod_1.z.coerce.string().optional(),
    database: zod_1.z.coerce.string().optional(),
    scope: zod_1.z.coerce.string(),
}).catchall(zod_1.z.unknown());
exports.AnyAuth = zod_1.z.union([
    exports.SuperUserAuth,
    exports.NamespaceAuth,
    exports.DatabaseAuth,
    exports.ScopeAuth,
]);
exports.Token = zod_1.z.string({ invalid_type_error: "Not a valid token" });
exports.TransformAuth = zod_1.z.union([
    zod_1.z.object({
        namespace: zod_1.z.string().optional(),
        database: zod_1.z.string().optional(),
        scope: zod_1.z.never().optional(),
        username: zod_1.z.string(),
        password: zod_1.z.string(),
    }).transform(({ namespace, database, username, password, }) => {
        const vars = {
            user: username,
            pass: password,
        };
        if (namespace) {
            vars.ns = namespace;
            if (database) {
                vars.db = database;
            }
        }
        return vars;
    }),
    zod_1.z.object({
        namespace: zod_1.z.string(),
        database: zod_1.z.string(),
        scope: zod_1.z.string(),
    }).catchall(zod_1.z.unknown()).transform(({ namespace, database, scope, ...rest }) => ({
        ns: namespace,
        db: database,
        sc: scope,
        ...rest,
    })),
]);
function processConnectionOptions({ prepare, auth, namespace, database, }) {
    zod_1.z.function().optional().parse(prepare);
    zod_1.z.union([exports.Token, exports.AnyAuth]).optional().parse(auth);
    const useOpts = namespace || database
        ? exports.UseOptions.parse({
            namespace,
            database,
        })
        : { namespace: undefined, database: undefined };
    return { prepare, auth, ...useOpts };
}
exports.processConnectionOptions = processConnectionOptions;
// Live
exports.Action = zod_1.z.union([
    zod_1.z.literal("CREATE"),
    zod_1.z.literal("UPDATE"),
    zod_1.z.literal("DELETE"),
]);
exports.LiveResult = zod_1.z.object({
    id: zod_1.z.instanceof(uuid_js_1.UUID),
    action: exports.Action,
    result: zod_1.z.record(zod_1.z.unknown()),
});
//# sourceMappingURL=types.js.map