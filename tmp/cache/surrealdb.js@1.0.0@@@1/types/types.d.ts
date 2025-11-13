import { z } from "zod";
import { RecordId } from "./library/cbor/recordid.js";
import { Surreal } from "./surreal.js";
import { UUID } from "./library/cbor/uuid.js";
export declare const UseOptions: z.ZodObject<{
    namespace: z.ZodString;
    database: z.ZodString;
}, "strip", z.ZodTypeAny, {
    namespace: string;
    database: string;
}, {
    namespace: string;
    database: string;
}>;
export type UseOptions = z.infer<typeof UseOptions>;
export type ActionResult<T extends Record<string, unknown>> = Prettify<T["id"] extends RecordId ? T : {
    id: RecordId;
} & T>;
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
export declare const SuperUserAuth: z.ZodObject<{
    namespace: z.ZodOptional<z.ZodNever>;
    database: z.ZodOptional<z.ZodNever>;
    scope: z.ZodOptional<z.ZodNever>;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    namespace?: undefined;
    database?: undefined;
    scope?: undefined;
}, {
    username: string;
    password: string;
    namespace?: undefined;
    database?: undefined;
    scope?: undefined;
}>;
export type SuperUserAuth = z.infer<typeof SuperUserAuth>;
export declare const NamespaceAuth: z.ZodObject<{
    namespace: z.ZodString;
    database: z.ZodOptional<z.ZodNever>;
    scope: z.ZodOptional<z.ZodNever>;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    namespace: string;
    username: string;
    password: string;
    database?: undefined;
    scope?: undefined;
}, {
    namespace: string;
    username: string;
    password: string;
    database?: undefined;
    scope?: undefined;
}>;
export type NamespaceAuth = z.infer<typeof NamespaceAuth>;
export declare const DatabaseAuth: z.ZodObject<{
    namespace: z.ZodString;
    database: z.ZodString;
    scope: z.ZodOptional<z.ZodNever>;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    namespace: string;
    database: string;
    username: string;
    password: string;
    scope?: undefined;
}, {
    namespace: string;
    database: string;
    username: string;
    password: string;
    scope?: undefined;
}>;
export type DatabaseAuth = z.infer<typeof DatabaseAuth>;
export declare const ScopeAuth: z.ZodObject<{
    namespace: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    scope: z.ZodString;
}, "strip", z.ZodUnknown, z.objectOutputType<{
    namespace: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    scope: z.ZodString;
}, z.ZodUnknown, "strip">, z.objectInputType<{
    namespace: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    scope: z.ZodString;
}, z.ZodUnknown, "strip">>;
export type ScopeAuth = z.infer<typeof ScopeAuth>;
export declare const AnyAuth: z.ZodUnion<[z.ZodObject<{
    namespace: z.ZodOptional<z.ZodNever>;
    database: z.ZodOptional<z.ZodNever>;
    scope: z.ZodOptional<z.ZodNever>;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    namespace?: undefined;
    database?: undefined;
    scope?: undefined;
}, {
    username: string;
    password: string;
    namespace?: undefined;
    database?: undefined;
    scope?: undefined;
}>, z.ZodObject<{
    namespace: z.ZodString;
    database: z.ZodOptional<z.ZodNever>;
    scope: z.ZodOptional<z.ZodNever>;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    namespace: string;
    username: string;
    password: string;
    database?: undefined;
    scope?: undefined;
}, {
    namespace: string;
    username: string;
    password: string;
    database?: undefined;
    scope?: undefined;
}>, z.ZodObject<{
    namespace: z.ZodString;
    database: z.ZodString;
    scope: z.ZodOptional<z.ZodNever>;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    namespace: string;
    database: string;
    username: string;
    password: string;
    scope?: undefined;
}, {
    namespace: string;
    database: string;
    username: string;
    password: string;
    scope?: undefined;
}>, z.ZodObject<{
    namespace: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    scope: z.ZodString;
}, "strip", z.ZodUnknown, z.objectOutputType<{
    namespace: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    scope: z.ZodString;
}, z.ZodUnknown, "strip">, z.objectInputType<{
    namespace: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    scope: z.ZodString;
}, z.ZodUnknown, "strip">>]>;
export type AnyAuth = z.infer<typeof AnyAuth>;
export declare const Token: z.ZodString;
export type Token = z.infer<typeof Token>;
export declare const TransformAuth: z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    namespace: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodNever>;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    namespace?: string | undefined;
    database?: string | undefined;
    scope?: undefined;
}, {
    username: string;
    password: string;
    namespace?: string | undefined;
    database?: string | undefined;
    scope?: undefined;
}>, Record<string, unknown>, {
    username: string;
    password: string;
    namespace?: string | undefined;
    database?: string | undefined;
    scope?: undefined;
}>, z.ZodEffects<z.ZodObject<{
    namespace: z.ZodString;
    database: z.ZodString;
    scope: z.ZodString;
}, "strip", z.ZodUnknown, z.objectOutputType<{
    namespace: z.ZodString;
    database: z.ZodString;
    scope: z.ZodString;
}, z.ZodUnknown, "strip">, z.objectInputType<{
    namespace: z.ZodString;
    database: z.ZodString;
    scope: z.ZodString;
}, z.ZodUnknown, "strip">>, {
    ns: string;
    db: string;
    sc: string;
}, z.objectInputType<{
    namespace: z.ZodString;
    database: z.ZodString;
    scope: z.ZodString;
}, z.ZodUnknown, "strip">>]>;
export type QueryResult<T = unknown> = QueryResultOk<T> | QueryResultErr;
export type QueryResultOk<T> = {
    status: "OK";
    time: string;
    result: T;
};
export type QueryResultErr = {
    status: "ERR";
    time: string;
    result: string;
};
export type MapQueryResult<T> = {
    [K in keyof T]: QueryResult<T[K]>;
};
type BasePatch<T = string> = {
    path: T;
};
export type AddPatch<T = string, U = unknown> = BasePatch<T> & {
    op: "add";
    value: U;
};
export type RemovePatch<T = string> = BasePatch<T> & {
    op: "remove";
};
export type ReplacePatch<T = string, U = unknown> = BasePatch<T> & {
    op: "replace";
    value: U;
};
export type ChangePatch<T = string, U = string> = BasePatch<T> & {
    op: "change";
    value: U;
};
export type CopyPatch<T = string, U = string> = BasePatch<T> & {
    op: "copy";
    from: U;
};
export type MovePatch<T = string, U = string> = BasePatch<T> & {
    op: "move";
    from: U;
};
export type TestPatch<T = string, U = unknown> = BasePatch<T> & {
    op: "test";
    value: U;
};
export type Patch = AddPatch | RemovePatch | ReplacePatch | ChangePatch | CopyPatch | MovePatch | TestPatch;
export type ConnectionOptions = {
    versionCheck?: boolean;
    versionCheckTimeout?: number;
    prepare?: (connection: Surreal) => unknown;
    auth?: AnyAuth | Token;
} & (UseOptions | {
    namespace?: never;
    database?: never;
});
export declare function processConnectionOptions({ prepare, auth, namespace, database, }: ConnectionOptions): {
    namespace: string;
    database: string;
    prepare: ((connection: Surreal) => unknown) | undefined;
    auth: string | {
        username: string;
        password: string;
        namespace?: undefined;
        database?: undefined;
        scope?: undefined;
    } | {
        namespace: string;
        username: string;
        password: string;
        database?: undefined;
        scope?: undefined;
    } | {
        namespace: string;
        database: string;
        username: string;
        password: string;
        scope?: undefined;
    } | z.objectOutputType<{
        namespace: z.ZodOptional<z.ZodString>;
        database: z.ZodOptional<z.ZodString>;
        scope: z.ZodString;
    }, z.ZodUnknown, "strip"> | undefined;
} | {
    namespace: undefined;
    database: undefined;
    prepare: ((connection: Surreal) => unknown) | undefined;
    auth: string | {
        username: string;
        password: string;
        namespace?: undefined;
        database?: undefined;
        scope?: undefined;
    } | {
        namespace: string;
        username: string;
        password: string;
        database?: undefined;
        scope?: undefined;
    } | {
        namespace: string;
        database: string;
        username: string;
        password: string;
        scope?: undefined;
    } | z.objectOutputType<{
        namespace: z.ZodOptional<z.ZodString>;
        database: z.ZodOptional<z.ZodString>;
        scope: z.ZodString;
    }, z.ZodUnknown, "strip"> | undefined;
};
export type RpcRequest<Method extends string = string, Params extends unknown[] | undefined = unknown[]> = {
    method: Method;
    params?: Params;
};
export type RpcResponse<Result extends unknown = unknown> = RpcResponseOk<Result> | RpcResponseErr;
export type RpcResponseOk<Result extends unknown = unknown> = {
    result: Result;
    error?: never;
};
export type RpcResponseErr = {
    result?: never;
    error: {
        code: number;
        message: string;
    };
};
export declare const Action: z.ZodUnion<[z.ZodLiteral<"CREATE">, z.ZodLiteral<"UPDATE">, z.ZodLiteral<"DELETE">]>;
export type Action = z.infer<typeof Action>;
export declare const LiveResult: z.ZodObject<{
    id: z.ZodType<typeof UUID, z.ZodTypeDef, typeof UUID>;
    action: z.ZodUnion<[z.ZodLiteral<"CREATE">, z.ZodLiteral<"UPDATE">, z.ZodLiteral<"DELETE">]>;
    result: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: typeof UUID;
    action: "CREATE" | "UPDATE" | "DELETE";
    result: Record<string, unknown>;
}, {
    id: typeof UUID;
    action: "CREATE" | "UPDATE" | "DELETE";
    result: Record<string, unknown>;
}>;
export type LiveResult = z.infer<typeof LiveResult>;
export type LiveHandler<Result extends Record<string, unknown> | Patch = Record<string, unknown>> = (action: Action, result: Result) => unknown;
export {};
