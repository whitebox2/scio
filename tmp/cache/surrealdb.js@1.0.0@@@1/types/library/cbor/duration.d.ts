import { Duration as IcholyDuration } from "@icholy/duration";
export declare class Duration extends IcholyDuration {
    toJSON(): string;
}
export declare function durationToCborCustomDuration(duration: Duration): number[];
export declare function cborCustomDurationToDuration([s, ns]: [number, number]): Duration;
