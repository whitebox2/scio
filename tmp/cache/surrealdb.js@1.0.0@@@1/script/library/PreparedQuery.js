"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreparedQuery = void 0;
class PreparedQuery {
    constructor(query, bindings, convert) {
        Object.defineProperty(this, "query", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "bindings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "convert", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.query = query;
        this.convert = convert;
        if (bindings)
            this.bindings = bindings;
    }
}
exports.PreparedQuery = PreparedQuery;
//# sourceMappingURL=PreparedQuery.js.map