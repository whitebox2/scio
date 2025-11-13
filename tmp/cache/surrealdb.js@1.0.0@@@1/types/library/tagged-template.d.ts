import { PreparedQuery } from "./PreparedQuery.js";
export declare function surrealql(query_raw: string[] | TemplateStringsArray, ...values: unknown[]): PreparedQuery<import("./PreparedQuery.js").ConvertMethod<unknown>>;
export { surrealql as surql };
