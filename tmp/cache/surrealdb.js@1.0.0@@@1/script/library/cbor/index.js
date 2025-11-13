"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv7 = exports.uuidv4 = exports.UUID = exports.Table = exports.StringRecordId = exports.RecordId = exports.GeometryPolygon = exports.GeometryPoint = exports.GeometryMultiPolygon = exports.GeometryMultiPoint = exports.GeometryMultiLine = exports.GeometryLine = exports.GeometryCollection = exports.Duration = exports.Decimal = exports.decodeCbor = exports.encodeCbor = void 0;
const cbor_redux_1 = require("cbor-redux");
const recordid_js_1 = require("./recordid.js");
Object.defineProperty(exports, "RecordId", { enumerable: true, get: function () { return recordid_js_1.RecordId; } });
Object.defineProperty(exports, "StringRecordId", { enumerable: true, get: function () { return recordid_js_1.StringRecordId; } });
const uuid_js_1 = require("./uuid.js");
Object.defineProperty(exports, "UUID", { enumerable: true, get: function () { return uuid_js_1.UUID; } });
Object.defineProperty(exports, "uuidv4", { enumerable: true, get: function () { return uuid_js_1.uuidv4; } });
Object.defineProperty(exports, "uuidv7", { enumerable: true, get: function () { return uuid_js_1.uuidv7; } });
const duration_js_1 = require("./duration.js");
Object.defineProperty(exports, "Duration", { enumerable: true, get: function () { return duration_js_1.Duration; } });
const decimal_js_1 = require("./decimal.js");
Object.defineProperty(exports, "Decimal", { enumerable: true, get: function () { return decimal_js_1.Decimal; } });
const geometry_js_1 = require("./geometry.js");
Object.defineProperty(exports, "GeometryCollection", { enumerable: true, get: function () { return geometry_js_1.GeometryCollection; } });
Object.defineProperty(exports, "GeometryLine", { enumerable: true, get: function () { return geometry_js_1.GeometryLine; } });
Object.defineProperty(exports, "GeometryMultiLine", { enumerable: true, get: function () { return geometry_js_1.GeometryMultiLine; } });
Object.defineProperty(exports, "GeometryMultiPoint", { enumerable: true, get: function () { return geometry_js_1.GeometryMultiPoint; } });
Object.defineProperty(exports, "GeometryMultiPolygon", { enumerable: true, get: function () { return geometry_js_1.GeometryMultiPolygon; } });
Object.defineProperty(exports, "GeometryPoint", { enumerable: true, get: function () { return geometry_js_1.GeometryPoint; } });
Object.defineProperty(exports, "GeometryPolygon", { enumerable: true, get: function () { return geometry_js_1.GeometryPolygon; } });
const table_js_1 = require("./table.js");
Object.defineProperty(exports, "Table", { enumerable: true, get: function () { return table_js_1.Table; } });
const datetime_js_1 = require("./datetime.js");
// Tags from the spec - https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml
const TAG_SPEC_DATETIME = 0;
const TAG_SPEC_UUID = 37;
// Custom tags
const TAG_NONE = 6;
const TAG_TABLE = 7;
const TAG_RECORDID = 8;
const TAG_STRING_UUID = 9;
const TAG_STRING_DECIMAL = 10;
// const TAG_BINARY_DECIMAL = 11;
const TAG_CUSTOM_DATETIME = 12;
const TAG_STRING_DURATION = 13;
const TAG_CUSTOM_DURATION = 14;
// Custom Geometries
const TAG_GEOMETRY_POINT = 88;
const TAG_GEOMETRY_LINE = 89;
const TAG_GEOMETRY_POLYGON = 90;
const TAG_GEOMETRY_MULTIPOINT = 91;
const TAG_GEOMETRY_MULTILINE = 92;
const TAG_GEOMETRY_MULTIPOLYGON = 93;
const TAG_GEOMETRY_COLLECTION = 94;
function encodeCbor(data) {
    return (0, cbor_redux_1.encode)(data, (_, v) => {
        if (v instanceof Date) {
            return new cbor_redux_1.TaggedValue((0, datetime_js_1.dateToCborCustomDate)(v), TAG_CUSTOM_DATETIME);
        }
        if (v === undefined)
            return new cbor_redux_1.TaggedValue(null, TAG_NONE);
        if (v instanceof uuid_js_1.UUID) {
            return new cbor_redux_1.TaggedValue(v.bytes.buffer, TAG_SPEC_UUID);
        }
        if (v instanceof decimal_js_1.Decimal) {
            return new cbor_redux_1.TaggedValue(v.toString(), TAG_STRING_DECIMAL);
        }
        if (v instanceof duration_js_1.Duration) {
            return new cbor_redux_1.TaggedValue((0, duration_js_1.durationToCborCustomDuration)(v), TAG_CUSTOM_DURATION);
        }
        if (v instanceof recordid_js_1.RecordId) {
            return new cbor_redux_1.TaggedValue([v.tb, v.id], TAG_RECORDID);
        }
        if (v instanceof recordid_js_1.StringRecordId) {
            return new cbor_redux_1.TaggedValue(v.rid, TAG_RECORDID);
        }
        if (v instanceof table_js_1.Table)
            return new cbor_redux_1.TaggedValue(v.tb, TAG_TABLE);
        if (v instanceof geometry_js_1.GeometryPoint) {
            return new cbor_redux_1.TaggedValue(v.point, TAG_GEOMETRY_POINT);
        }
        if (v instanceof geometry_js_1.GeometryLine) {
            return new cbor_redux_1.TaggedValue(v.line, TAG_GEOMETRY_LINE);
        }
        if (v instanceof geometry_js_1.GeometryPolygon) {
            return new cbor_redux_1.TaggedValue(v.polygon, TAG_GEOMETRY_POLYGON);
        }
        if (v instanceof geometry_js_1.GeometryMultiPoint) {
            return new cbor_redux_1.TaggedValue(v.points, TAG_GEOMETRY_MULTIPOINT);
        }
        if (v instanceof geometry_js_1.GeometryMultiLine) {
            return new cbor_redux_1.TaggedValue(v.lines, TAG_GEOMETRY_MULTILINE);
        }
        if (v instanceof geometry_js_1.GeometryMultiPolygon) {
            return new cbor_redux_1.TaggedValue(v.polygons, TAG_GEOMETRY_MULTIPOLYGON);
        }
        if (v instanceof geometry_js_1.GeometryCollection) {
            return new cbor_redux_1.TaggedValue(v.collection, TAG_GEOMETRY_COLLECTION);
        }
        return v;
    });
}
exports.encodeCbor = encodeCbor;
function decodeCbor(data) {
    return (0, cbor_redux_1.decode)(data, (_, v) => {
        if (!(v instanceof cbor_redux_1.TaggedValue))
            return v;
        switch (v.tag) {
            case TAG_SPEC_DATETIME:
                return new Date(v.value);
            case TAG_SPEC_UUID:
                return uuid_js_1.UUID.ofInner(new Uint8Array(v.value));
            case TAG_CUSTOM_DATETIME:
                return (0, datetime_js_1.cborCustomDateToDate)(v.value);
            case TAG_NONE:
                return undefined;
            case TAG_STRING_UUID:
                return uuid_js_1.UUID.parse(v.value);
            case TAG_STRING_DECIMAL:
                return new decimal_js_1.Decimal(v.value);
            case TAG_STRING_DURATION:
                return new duration_js_1.Duration(v.value);
            case TAG_CUSTOM_DURATION:
                return (0, duration_js_1.cborCustomDurationToDuration)(v.value);
            case TAG_TABLE:
                return new table_js_1.Table(v.value);
            case TAG_RECORDID:
                return new recordid_js_1.RecordId(v.value[0], v.value[1]);
            case TAG_GEOMETRY_POINT:
                return new geometry_js_1.GeometryPoint(v.value);
            case TAG_GEOMETRY_LINE:
                return new geometry_js_1.GeometryLine(v.value);
            case TAG_GEOMETRY_POLYGON:
                return new geometry_js_1.GeometryPolygon(v.value);
            case TAG_GEOMETRY_MULTIPOINT:
                return new geometry_js_1.GeometryMultiPoint(v.value);
            case TAG_GEOMETRY_MULTILINE:
                return new geometry_js_1.GeometryMultiLine(v.value);
            case TAG_GEOMETRY_MULTIPOLYGON:
                return new geometry_js_1.GeometryMultiPolygon(v.value);
            case TAG_GEOMETRY_COLLECTION:
                return new geometry_js_1.GeometryCollection(v.value);
        }
    });
}
exports.decodeCbor = decodeCbor;
//# sourceMappingURL=index.js.map