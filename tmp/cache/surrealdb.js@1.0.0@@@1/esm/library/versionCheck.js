import semver from "semver";
import { UnsupportedVersion, VersionRetrievalFailure } from "../errors.js";
export const supportedSurrealDbVersionRange = ">= 2.3.0";
export function versionCheck(version) {
    if (!isVersionSupported(version)) {
        throw new UnsupportedVersion(version, supportedSurrealDbVersionRange);
    }
    return true;
}
export function isVersionSupported(version) {
    return semver.satisfies(version, supportedSurrealDbVersionRange);
}
export async function retrieveRemoteVersion(url, timeout) {
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
            throw new VersionRetrievalFailure();
        })
            .finally(() => {
            clearTimeout(id);
        });
        return version;
    }
    throw new VersionRetrievalFailure();
}
//# sourceMappingURL=versionCheck.js.map
