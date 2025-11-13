"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAuthVars = void 0;
const errors_js_1 = require("../errors.js");
const isNil_js_1 = require("./isNil.js");
function processAuthVars(vars, fallback) {
    if ("scope" in vars) {
        if (!vars.namespace)
            vars.namespace = fallback?.namespace;
        if (!vars.database)
            vars.database = fallback?.database;
        if ((0, isNil_js_1.isNil)(vars.namespace)) {
            throw new errors_js_1.NoNamespaceSpecified();
        }
        if ((0, isNil_js_1.isNil)(vars.database))
            throw new errors_js_1.NoDatabaseSpecified();
    }
    return vars;
}
exports.processAuthVars = processAuthVars;
//# sourceMappingURL=processAuthVars.js.map