export function msToNs(ms) {
    return ms * 1000000;
}
export function nsToMs(ns) {
    return Math.floor(ns / 1000000);
}
export function dateToCborCustomDate(date) {
    const s = Math.floor(date.getTime() / 1000);
    const ms = date.getTime() - s * 1000;
    return [s, ms * 1000000];
}
export function cborCustomDateToDate([s, ns]) {
    const date = new Date(0);
    date.setUTCSeconds(Number(s));
    date.setMilliseconds(Math.floor(Number(ns) / 1000000));
    return date;
}
//# sourceMappingURL=datetime.js.map