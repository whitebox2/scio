import { z } from "zod";
export const RecordIdValue = z.union([
    z.string(),
    z.number(),
    z.bigint(),
    z.record(z.unknown()),
    z.array(z.unknown()),
]);
export class RecordId {
    constructor(tb, id) {
        Object.defineProperty(this, "tb", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.tb = z.string().parse(tb);
        this.id = RecordIdValue.parse(id);
    }
    toJSON() {
        return this.toString();
    }
    toString() {
        const tb = escape_ident(this.tb);
        const id = typeof this.id == "string"
            ? escape_ident(this.id)
            : JSON.stringify(this.id);
        return `${tb}:${id}`;
    }
}
export class StringRecordId {
    constructor(rid) {
        Object.defineProperty(this, "rid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.rid = z.string().parse(rid);
    }
    toJSON() {
        return this.rid;
    }
    toString() {
        return this.rid;
    }
}
function escape_ident(str) {
    let code, i, len;
    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123) && // lower alpha (a-z)
            !(code == 95) // underscore (_)
        ) {
            return `⟨${str.replaceAll("⟩", "\⟩")}⟩`;
        }
    }
    return str;
}
//# sourceMappingURL=recordid.js.map