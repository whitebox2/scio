"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveRemoteVersion = exports.isVersionSupported = exports.versionCheck = exports.supportedSurrealDbVersionRange = void 0;
const semver_1 = __importDefault(require("semver"));
const errors_js_1 = require("../errors.js");
exports.supportedSurrealDbVersionRange = ">= 2.3.0";
function versionCheck(version) {
    if (!isVersionSupported(version)) {
        throw new errors_js_1.UnsupportedVersion(version, exports.supportedSurrealDbVersionRange);
    }
    return true;
}
exports.versionCheck = versionCheck;
function isVersionSupported(version) {
    return semver_1.default.satisfies(version, exports.supportedSurrealDbVersionRange);
}
exports.isVersionSupported = isVersionSupported;
async function retrieveRemoteVersion(url, timeout) {
    const mappedProtocols = {
        "ws:": "http:",
        "wss:": "https:",
        "http:": "http:",
        "https:": "https:",
    };
    const protocol = mappedProtocols[url.protocol];
    if (protocol) {
        url = new URL(url);
        url.protocol = protocol;
        url.pathname = url.pathname.slice(0, -4) + "/version";
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const versionPrefix = "surrealdb-";
        const version = await fetch(url, {
            signal: controller.signal,
        })
            .then((res) => res.text())
            .then((version) => version.slice(versionPrefix.length))
            .catch(() => {
            throw new errors_js_1.VersionRetrievalFailure();
        })
            .finally(() => {
            clearTimeout(id);
        });
        return version;
    }
    throw new errors_js_1.VersionRetrievalFailure();
}
exports.retrieveRemoteVersion = retrieveRemoteVersion;
//# sourceMappingURL=versionCheck.js.map
