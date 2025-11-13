import { z } from "zod";
import { UUID } from "./library/cbor/uuid.js";
export const UseOptions = z.object({
    namespace: z.coerce.string(),
    database: z.coerce.string(),
});
//////////////////////////////////////////////
//////////   AUTHENTICATION TYPES   //////////
//////////////////////////////////////////////
export const SuperUserAuth = z.object({
    namespace: z.never().optional(),
    database: z.never().optional(),
    scope: z.never().optional(),
    username: z.coerce.string(),
    password: z.coerce.string(),
});
export const NamespaceAuth = z.object({
    namespace: z.coerce.string(),
    database: z.never().optional(),
    scope: z.never().optional(),
    username: z.coerce.string(),
    password: z.coerce.string(),
});
export const DatabaseAuth = z.object({
    namespace: z.coerce.string(),
    database: z.coerce.string(),
    scope: z.never().optional(),
    username: z.coerce.string(),
    password: z.coerce.string(),
});
export const ScopeAuth = z.object({
    namespace: z.coerce.string().optional(),
    database: z.coerce.string().optional(),
    scope: z.coerce.string(),
}).catchall(z.unknown());
export const AnyAuth = z.union([
    SuperUserAuth,
    NamespaceAuth,
    DatabaseAuth,
    ScopeAuth,
]);
export const Token = z.string({ invalid_type_error: "Not a valid token" });
export const TransformAuth = z.union([
    z.object({
        namespace: z.string().optional(),
        database: z.string().optional(),
        scope: z.never().optional(),
        username: z.string(),
        password: z.string(),
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
    z.object({
        namespace: z.string(),
        database: z.string(),
        scope: z.string(),
    }).catchall(z.unknown()).transform(({ namespace, database, scope, ...rest }) => ({
        ns: namespace,
        db: database,
        sc: scope,
        ...rest,
    })),
]);
export function processConnectionOptions({ prepare, auth, namespace, database, }) {
    z.function().optional().parse(prepare);
    z.union([Token, AnyAuth]).optional().parse(auth);
    const useOpts = namespace || database
        ? UseOptions.parse({
            namespace,
            database,
        })
        : { namespace: undefined, database: undefined };
    return { prepare, auth, ...useOpts };
}
// Live
export const Action = z.union([
    z.literal("CREATE"),
    z.literal("UPDATE"),
    z.literal("DELETE"),
]);
export const LiveResult = z.object({
    id: z.instanceof(UUID),
    action: Action,
    result: z.record(z.unknown()),
});
//# sourceMappingURL=types.js.map