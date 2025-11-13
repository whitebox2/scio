"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreparedQuery = exports.surrealql = exports.surql = exports.Emitter = exports.Engine = exports.ConnectionStatus = exports.default = exports.Surreal = void 0;
var surreal_js_1 = require("./surreal.js");
Object.defineProperty(exports, "Surreal", { enumerable: true, get: function () { return surreal_js_1.Surreal; } });
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return surreal_js_1.Surreal; } });
var engine_js_1 = require("./library/engine.js");
Object.defineProperty(exports, "ConnectionStatus", { enumerable: true, get: function () { return engine_js_1.ConnectionStatus; } });
Object.defineProperty(exports, "Engine", { enumerable: true, get: function () { return engine_js_1.Engine; } });
var emitter_js_1 = require("./library/emitter.js");
Object.defineProperty(exports, "Emitter", { enumerable: true, get: function () { return emitter_js_1.Emitter; } });
__exportStar(require("./library/cbor/index.js"), exports);
var tagged_template_js_1 = require("./library/tagged-template.js");
Object.defineProperty(exports, "surql", { enumerable: true, get: function () { return tagged_template_js_1.surql; } });
Object.defineProperty(exports, "surrealql", { enumerable: true, get: function () { return tagged_template_js_1.surrealql; } });
var PreparedQuery_js_1 = require("./library/PreparedQuery.js");
Object.defineProperty(exports, "PreparedQuery", { enumerable: true, get: function () { return PreparedQuery_js_1.PreparedQuery; } });
__exportStar(require("./errors.js"), exports);
__exportStar(require("./types.js"), exports);
__exportStar(require("./library/jsonify.js"), exports);
__exportStar(require("./library/versionCheck.js"), exports);
//# sourceMappingURL=index.js.map