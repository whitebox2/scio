import { Duration as IcholyDuration } from "@icholy/duration";
export class Duration extends IcholyDuration {
    toJSON() {
        return this.toString();
    }
}
export function durationToCborCustomDuration(duration) {
    const ms = duration.milliseconds();
    const s = Math.floor(ms / 1000);
    const ns = Math.floor((ms - s * 1000) * 1000000);
    return ns > 0 ? [s, ns] : s > 0 ? [s] : [];
}
export function cborCustomDurationToDuration([s, ns]) {
    s = s ?? 0;
    ns = ns ?? 0;
    const ms = (s * 1000) + (ns / 1000000);
    return new Duration(ms);
}
//# sourceMappingURL=duration.js.map