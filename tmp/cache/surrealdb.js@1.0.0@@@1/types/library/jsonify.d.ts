import { Decimal } from "./cbor/decimal.js";
import { Geometry } from "./cbor/geometry.js";
import { Duration } from "./cbor/index.js";
import { RecordId, StringRecordId } from "./cbor/recordid.js";
import { Table } from "./cbor/table.js";
import { UUID } from "./cbor/uuid.js";
export type Jsonify<T extends unknown> = T extends Date | UUID | Decimal | Duration | StringRecordId ? string : T extends undefined ? never : T extends Record<string | number | symbol, unknown> | Array<unknown> ? {
    [K in keyof T]: Jsonify<T[K]>;
} : T extends Geometry ? ReturnType<T["toJSON"]> : T extends RecordId<infer Tb> ? `${Tb}:${string}` : T extends Table<infer Tb> ? `${Tb}` : T;
export declare function jsonify<T extends unknown>(input: T): Jsonify<T>;
