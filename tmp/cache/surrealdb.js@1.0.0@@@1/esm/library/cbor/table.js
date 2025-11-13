import { z } from "zod";
export class Table {
    constructor(tb) {
        Object.defineProperty(this, "tb", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.tb = z.string().parse(tb);
    }
    toJSON() {
        return this.tb;
    }
    toString() {
        return this.tb;
    }
}
//# sourceMappingURL=table.js.map