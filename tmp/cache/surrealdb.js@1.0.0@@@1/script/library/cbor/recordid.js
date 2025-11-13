"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringRecordId = exports.RecordId = exports.RecordIdValue = void 0;
const zod_1 = require("zod");
exports.RecordIdValue = zod_1.z.union([
    zod_1.z.string(),
    zod_1.z.number(),
    zod_1.z.bigint(),
    zod_1.z.record(zod_1.z.unknown()),
    zod_1.z.array(zod_1.z.unknown()),
]);
class RecordId {
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
        this.tb = zod_1.z.string().parse(tb);
        this.id = exports.RecordIdValue.parse(id);
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
exports.RecordId = RecordId;
class StringRecordId {
    constructor(rid) {
        Object.defineProperty(this, "rid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.rid = zod_1.z.string().parse(rid);
    }
    toJSON() {
        return this.rid;
    }
    toString() {
        return this.rid;
    }
}
exports.StringRecordId = StringRecordId;
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