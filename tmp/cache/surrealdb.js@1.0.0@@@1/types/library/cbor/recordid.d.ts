import { z } from "zod";
export declare const RecordIdValue: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBigInt, z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodUnknown, "many">]>;
export type RecordIdValue = z.infer<typeof RecordIdValue>;
export declare class RecordId<Tb extends string = string> {
    readonly tb: Tb;
    readonly id: RecordIdValue;
    constructor(tb: Tb, id: RecordIdValue);
    toJSON(): string;
    toString(): string;
}
export declare class StringRecordId {
    readonly rid: string;
    constructor(rid: string);
    toJSON(): string;
    toString(): string;
}
