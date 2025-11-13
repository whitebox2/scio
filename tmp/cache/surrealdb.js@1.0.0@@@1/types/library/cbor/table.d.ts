export declare class Table<Tb extends string = string> {
    readonly tb: Tb;
    constructor(tb: Tb);
    toJSON(): Tb;
    toString(): Tb;
}
