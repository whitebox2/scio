"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const zod_1 = require("zod");
class Table {
    constructor(tb) {
        Object.defineProperty(this, "tb", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.tb = zod_1.z.string().parse(tb);
    }
    toJSON() {
        return this.tb;
    }
    toString() {
        return this.tb;
    }
}
exports.Table = Table;
//# sourceMappingURL=table.js.map