export type ConvertMethod<T extends unknown = unknown> = (result: unknown[]) => T;
export declare class PreparedQuery<C extends ConvertMethod | undefined = ConvertMethod> {
    readonly query: string;
    readonly bindings: Record<string, unknown>;
    readonly convert?: C;
    constructor(query: string, bindings?: Record<string, unknown>, convert?: C);
}
