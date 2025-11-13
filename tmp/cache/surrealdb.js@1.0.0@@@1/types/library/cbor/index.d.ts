import { RecordId, StringRecordId } from "./recordid.js";
import { UUID, uuidv4, uuidv7 } from "./uuid.js";
import { Duration } from "./duration.js";
import { Decimal } from "./decimal.js";
import { GeometryCollection, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryPoint, GeometryPolygon } from "./geometry.js";
import { Table } from "./table.js";
export declare function encodeCbor<T extends unknown>(data: T): ArrayBuffer;
export declare function decodeCbor(data: ArrayBuffer): any;
export { Decimal, Duration, GeometryCollection, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryPoint, GeometryPolygon, RecordId, StringRecordId, Table, UUID, uuidv4, uuidv7, };
