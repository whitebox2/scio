"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionRetrievalFailure = exports.UnsupportedVersion = exports.NoTokenReturned = exports.NoDatabaseSpecified = exports.NoNamespaceSpecified = exports.ResponseError = exports.HttpConnectionError = exports.MissingNamespaceDatabase = exports.ConnectionUnavailable = exports.UnsupportedEngine = exports.UnexpectedConnectionError = exports.UnexpectedServerResponse = exports.EngineDisconnected = exports.InvalidURLProvided = exports.UnexpectedResponse = exports.NoConnectionDetails = exports.NoActiveSocket = exports.SurrealDbError = void 0;
class SurrealDbError extends Error {
}
exports.SurrealDbError = SurrealDbError;
class NoActiveSocket extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "NoActiveSocket"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "No socket is currently connected to a SurrealDB instance. Please call the .connect() method first!"
        });
    }
}
exports.NoActiveSocket = NoActiveSocket;
class NoConnectionDetails extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "NoConnectionDetails"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "No connection details for the HTTP api have been provided. Please call the .connect() method first!"
        });
    }
}
exports.NoConnectionDetails = NoConnectionDetails;
class UnexpectedResponse extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnexpectedResponse"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "The returned response from the SurrealDB instance is in an unexpected format. Unable to process response!"
        });
    }
}
exports.UnexpectedResponse = UnexpectedResponse;
class InvalidURLProvided extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "InvalidURLProvided"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "The provided string is either not a URL or is a URL but with an invalid protocol!"
        });
    }
}
exports.InvalidURLProvided = InvalidURLProvided;
class EngineDisconnected extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "EngineDisconnected"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "The engine reported the connection to SurrealDB has dropped"
        });
    }
}
exports.EngineDisconnected = EngineDisconnected;
class UnexpectedServerResponse extends SurrealDbError {
    constructor(response) {
        super();
        Object.defineProperty(this, "response", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: response
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnexpectedServerResponse"
        });
        this.message = `${response}`;
    }
}
exports.UnexpectedServerResponse = UnexpectedServerResponse;
class UnexpectedConnectionError extends SurrealDbError {
    constructor(error) {
        super();
        Object.defineProperty(this, "error", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: error
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnexpectedConnectionError"
        });
        this.message = `${error}`;
    }
}
exports.UnexpectedConnectionError = UnexpectedConnectionError;
class UnsupportedEngine extends SurrealDbError {
    constructor(engine) {
        super();
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: engine
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnsupportedEngine"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "The engine you are trying to connect to is not supported or configured."
        });
    }
}
exports.UnsupportedEngine = UnsupportedEngine;
class ConnectionUnavailable extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ConnectionUnavailable"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "There is no connection available at this moment."
        });
    }
}
exports.ConnectionUnavailable = ConnectionUnavailable;
class MissingNamespaceDatabase extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "MissingNamespaceDatabase"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "There are no namespace and/or database configured."
        });
    }
}
exports.MissingNamespaceDatabase = MissingNamespaceDatabase;
class HttpConnectionError extends SurrealDbError {
    constructor(message, status, statusText, buffer) {
        super();
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: message
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "statusText", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: statusText
        });
        Object.defineProperty(this, "buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: buffer
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "HttpConnectionError"
        });
    }
}
exports.HttpConnectionError = HttpConnectionError;
class ResponseError extends SurrealDbError {
    constructor(message) {
        super();
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: message
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ResponseError"
        });
    }
}
exports.ResponseError = ResponseError;
class NoNamespaceSpecified extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "NoNamespaceSpecified"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Please specify a namespace to use."
        });
    }
}
exports.NoNamespaceSpecified = NoNamespaceSpecified;
class NoDatabaseSpecified extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "NoDatabaseSpecified"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Please specify a database to use."
        });
    }
}
exports.NoDatabaseSpecified = NoDatabaseSpecified;
class NoTokenReturned extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "NoTokenReturned"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Did not receive an authentication token."
        });
    }
}
exports.NoTokenReturned = NoTokenReturned;
class UnsupportedVersion extends SurrealDbError {
    constructor(version, supportedRange) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "UnsupportedVersion"
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "supportedRange", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.version = version;
        this.supportedRange = supportedRange;
        this.message =
            `The version "${version}" reported by the engine is not supported by this library, expected a version that satisfies "${supportedRange}".`;
    }
}
exports.UnsupportedVersion = UnsupportedVersion;
class VersionRetrievalFailure extends SurrealDbError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "VersionRetrievalFailure"
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Failed to retrieve remote version. If the server is behind a proxy, make sure it's configured correctly."
        });
    }
}
exports.VersionRetrievalFailure = VersionRetrievalFailure;
//# sourceMappingURL=errors.js.map