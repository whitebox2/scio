"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeometryCollection = exports.GeometryMultiPolygon = exports.GeometryMultiLine = exports.GeometryMultiPoint = exports.GeometryPolygon = exports.GeometryLine = exports.GeometryPoint = exports.Geometry = void 0;
const decimal_js_1 = require("decimal.js");
class Geometry {
}
exports.Geometry = Geometry;
class GeometryPoint extends Geometry {
    constructor(point) {
        super();
        Object.defineProperty(this, "point", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        point = point instanceof GeometryPoint ? point.point : point;
        this.point = [
            point[0] instanceof decimal_js_1.Decimal ? point[0] : new decimal_js_1.Decimal(point[0]),
            point[1] instanceof decimal_js_1.Decimal ? point[1] : new decimal_js_1.Decimal(point[1]),
        ];
    }
    toJSON() {
        return {
            type: "Point",
            coordinates: this.coordinates,
        };
    }
    get coordinates() {
        return this.point;
    }
}
exports.GeometryPoint = GeometryPoint;
class GeometryLine extends Geometry {
    // SurrealDB only has the context of a "Line", which is two points.
    // SurrealDB's "Line" is actually a "LineString" under the hood, which accepts two or more points
    constructor(line) {
        super();
        Object.defineProperty(this, "line", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        line = line instanceof GeometryLine ? line.line : line;
        this.line = [new GeometryPoint(line[0]), new GeometryPoint(line[1])];
    }
    toJSON() {
        return {
            type: "LineString",
            coordinates: this.coordinates,
        };
    }
    get coordinates() {
        return this.line.map((g) => g.coordinates);
    }
}
exports.GeometryLine = GeometryLine;
class GeometryPolygon extends Geometry {
    constructor(polygon) {
        super();
        Object.defineProperty(this, "polygon", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        polygon = polygon instanceof GeometryPolygon
            ? polygon.polygon
            : polygon;
        this.polygon = polygon.map((line) => new GeometryLine(line));
    }
    toJSON() {
        return {
            type: "Polygon",
            coordinates: this.coordinates,
        };
    }
    get coordinates() {
        return this.polygon.map((g) => g.coordinates);
    }
}
exports.GeometryPolygon = GeometryPolygon;
class GeometryMultiPoint extends Geometry {
    constructor(points) {
        super();
        Object.defineProperty(this, "points", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        points = points instanceof GeometryMultiPoint ? points.points : points;
        this.points = points.map((point) => new GeometryPoint(point));
    }
    toJSON() {
        return {
            type: "MultiPoint",
            coordinates: this.coordinates,
        };
    }
    get coordinates() {
        return this.points.map((g) => g.coordinates);
    }
}
exports.GeometryMultiPoint = GeometryMultiPoint;
class GeometryMultiLine extends Geometry {
    constructor(lines) {
        super();
        Object.defineProperty(this, "lines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        lines = lines instanceof GeometryMultiLine ? lines.lines : lines;
        this.lines = lines.map((line) => new GeometryLine(line));
    }
    toJSON() {
        return {
            type: "MultiLineString",
            coordinates: this.coordinates,
        };
    }
    get coordinates() {
        return this.lines.map((g) => g.coordinates);
    }
}
exports.GeometryMultiLine = GeometryMultiLine;
class GeometryMultiPolygon extends Geometry {
    constructor(polygons) {
        super();
        Object.defineProperty(this, "polygons", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        polygons = polygons instanceof GeometryMultiPolygon
            ? polygons.polygons
            : polygons;
        this.polygons = polygons.map((polygon) => new GeometryPolygon(polygon));
    }
    toJSON() {
        return {
            type: "MultiPolygon",
            coordinates: this.coordinates,
        };
    }
    get coordinates() {
        return this.polygons.map((g) => g.coordinates);
    }
}
exports.GeometryMultiPolygon = GeometryMultiPolygon;
class GeometryCollection extends Geometry {
    constructor(collection) {
        super();
        Object.defineProperty(this, "collection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        collection = collection instanceof GeometryCollection
            ? collection.collection
            : collection;
        this.collection = collection;
    }
    toJSON() {
        return {
            type: "GeometryCollection",
            geometries: this.geometries,
        };
    }
    get geometries() {
        return this.collection;
    }
}
exports.GeometryCollection = GeometryCollection;
//# sourceMappingURL=geometry.js.map