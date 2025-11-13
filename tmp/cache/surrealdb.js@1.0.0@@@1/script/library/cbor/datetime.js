"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cborCustomDateToDate = exports.dateToCborCustomDate = exports.nsToMs = exports.msToNs = void 0;
function msToNs(ms) {
    return ms * 1000000;
}
exports.msToNs = msToNs;
function nsToMs(ns) {
    return Math.floor(ns / 1000000);
}
exports.nsToMs = nsToMs;
function dateToCborCustomDate(date) {
    const s = Math.floor(date.getTime() / 1000);
    const ms = date.getTime() - s * 1000;
    return [s, ms * 1000000];
}
exports.dateToCborCustomDate = dateToCborCustomDate;
function cborCustomDateToDate([s, ns]) {
    const date = new Date(0);
    date.setUTCSeconds(Number(s));
    date.setMilliseconds(Math.floor(Number(ns) / 1000000));
    return date;
}
exports.cborCustomDateToDate = cborCustomDateToDate;
//# sourceMappingURL=datetime.js.map