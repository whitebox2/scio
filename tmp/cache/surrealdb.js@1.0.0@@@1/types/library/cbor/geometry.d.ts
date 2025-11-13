import { Decimal } from "decimal.js";
export declare abstract class Geometry {
    abstract toJSON(): {
        type: "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";
        coordinates: unknown[];
    } | {
        type: "GeometryCollection";
        geometries: Geometry[];
    };
}
export declare class GeometryPoint extends Geometry {
    readonly point: [Decimal, Decimal];
    constructor(point: [number | Decimal, number | Decimal] | GeometryPoint);
    toJSON(): {
        type: "Point";
        coordinates: [Decimal, Decimal];
    };
    get coordinates(): [Decimal, Decimal];
}
export declare class GeometryLine extends Geometry {
    readonly line: [GeometryPoint, GeometryPoint, ...GeometryPoint[]];
    constructor(line: [GeometryPoint, GeometryPoint, ...GeometryPoint[]] | GeometryLine);
    toJSON(): {
        type: "LineString";
        coordinates: [Decimal, Decimal][];
    };
    get coordinates(): [Decimal, Decimal][];
}
export declare class GeometryPolygon extends Geometry {
    readonly polygon: [GeometryLine, ...GeometryLine[]];
    constructor(polygon: [GeometryLine, ...GeometryLine[]] | GeometryPolygon);
    toJSON(): {
        type: "Polygon";
        coordinates: [Decimal, Decimal][][];
    };
    get coordinates(): [Decimal, Decimal][][];
}
export declare class GeometryMultiPoint extends Geometry {
    readonly points: [GeometryPoint, ...GeometryPoint[]];
    constructor(points: [GeometryPoint, ...GeometryPoint[]] | GeometryMultiPoint);
    toJSON(): {
        type: "MultiPoint";
        coordinates: [Decimal, Decimal][];
    };
    get coordinates(): [Decimal, Decimal][];
}
export declare class GeometryMultiLine extends Geometry {
    readonly lines: [GeometryLine, ...GeometryLine[]];
    constructor(lines: [GeometryLine, ...GeometryLine[]] | GeometryMultiLine);
    toJSON(): {
        type: "MultiLineString";
        coordinates: [Decimal, Decimal][][];
    };
    get coordinates(): [Decimal, Decimal][][];
}
export declare class GeometryMultiPolygon extends Geometry {
    readonly polygons: [GeometryPolygon, ...GeometryPolygon[]];
    constructor(polygons: [GeometryPolygon, ...GeometryPolygon[]] | GeometryMultiPolygon);
    toJSON(): {
        type: "MultiPolygon";
        coordinates: [Decimal, Decimal][][][];
    };
    get coordinates(): [Decimal, Decimal][][][];
}
export declare class GeometryCollection<T extends [Geometry, ...Geometry[]]> extends Geometry {
    readonly collection: T;
    constructor(collection: T | GeometryCollection<T>);
    toJSON(): {
        type: "GeometryCollection";
        geometries: Geometry[];
    };
    get geometries(): Geometry[];
}
