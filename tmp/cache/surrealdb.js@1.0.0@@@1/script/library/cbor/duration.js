"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cborCustomDurationToDuration = exports.durationToCborCustomDuration = exports.Duration = void 0;
const duration_1 = require("@icholy/duration");
class Duration extends duration_1.Duration {
    toJSON() {
        return this.toString();
    }
}
exports.Duration = Duration;
function durationToCborCustomDuration(duration) {
    const ms = duration.milliseconds();
    const s = Math.floor(ms / 1000);
    const ns = Math.floor((ms - s * 1000) * 1000000);
    return ns > 0 ? [s, ns] : s > 0 ? [s] : [];
}
exports.durationToCborCustomDuration = durationToCborCustomDuration;
function cborCustomDurationToDuration([s, ns]) {
    s = s ?? 0;
    ns = ns ?? 0;
    const ms = (s * 1000) + (ns / 1000000);
    return new Duration(ms);
}
exports.cborCustomDurationToDuration = cborCustomDurationToDuration;
//# sourceMappingURL=duration.js.map