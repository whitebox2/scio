"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Duration = void 0;
var millisecond = 1, second = 1000 * millisecond, minute = 60 * second, hour = 60 * minute, day = 24 * hour, week = 7 * day;
var microsecond = millisecond / 1000, nanosecond = microsecond / 1000;
var unitMap = {
    "ns": nanosecond,
    "us": microsecond,
    "µs": microsecond,
    "μs": microsecond,
    "ms": millisecond,
    "s": second,
    "m": minute,
    "h": hour,
    "d": day,
    "w": week
};
var Duration = /** @class */ (function () {
    function Duration(value) {
        if (value instanceof Duration) {
            this._milliseconds = value.valueOf();
            return;
        }
        switch (typeof value) {
            case "number":
                if (!isFinite(value)) {
                    throw new Error("invalid duration: " + value);
                }
                this._milliseconds = value;
                break;
            case "string":
                this._milliseconds = Duration.parse(value).valueOf();
                break;
            case "undefined":
                this._milliseconds = 0;
                break;
            default:
                throw new Error("invalid duration: " + value);
        }
    }
    Duration.microseconds = function (us) {
        var ms = Math.floor(us / 1000);
        return new Duration(ms);
    };
    Duration.milliseconds = function (milliseconds) {
        return new Duration(milliseconds * millisecond);
    };
    Duration.seconds = function (seconds) {
        return new Duration(seconds * second);
    };
    Duration.minutes = function (minutes) {
        return new Duration(minutes * minute);
    };
    Duration.hours = function (hours) {
        return new Duration(hours * hour);
    };
    Duration.days = function (days) {
        return new Duration(days * day);
    };
    Duration.weeks = function (weeks) {
        return new Duration(weeks * week);
    };
    Duration.prototype.nanoseconds = function () {
        return Math.floor(this._milliseconds / nanosecond);
    };
    Duration.prototype.microseconds = function () {
        return Math.floor(this._milliseconds / microsecond);
    };
    Duration.prototype.milliseconds = function () {
        return this._milliseconds;
    };
    Duration.prototype.seconds = function () {
        return Math.floor(this._milliseconds / second);
    };
    Duration.prototype.minutes = function () {
        return Math.floor(this._milliseconds / minute);
    };
    Duration.prototype.hours = function () {
        return Math.floor(this._milliseconds / hour);
    };
    Duration.prototype.days = function () {
        return Math.floor(this._milliseconds / day);
    };
    Duration.prototype.weeks = function () {
        return Math.floor(this._milliseconds / week);
    };
    Duration.prototype.toString = function () {
        var str = "", milliseconds = Math.abs(this._milliseconds), sign = this._milliseconds < 0 ? "-" : "";
        // no units for 0 duration
        if (milliseconds === 0) {
            return "0";
        }
        // hours
        var hours = Math.floor(milliseconds / hour);
        if (hours !== 0) {
            milliseconds -= hour * hours;
            str += hours.toString() + "h";
        }
        // minutes
        var minutes = Math.floor(milliseconds / minute);
        if (minutes !== 0) {
            milliseconds -= minute * minutes;
            str += minutes.toString() + "m";
        }
        // seconds
        var seconds = Math.floor(milliseconds / second);
        if (seconds !== 0) {
            milliseconds -= second * seconds;
            str += seconds.toString() + "s";
        }
        // milliseconds
        if (milliseconds !== 0) {
            str += milliseconds.toString() + "ms";
        }
        return sign + str;
    };
    Duration.prototype.valueOf = function () {
        return this._milliseconds;
    };
    Duration.prototype.abs = function () {
        return new Duration(Math.abs(this._milliseconds));
    };
    Duration.parse = function (duration) {
        if (duration === "0" || duration === "+0" || duration === "-0") {
            return new Duration(0);
        }
        var regex = /([\-\+\d\.]+)([a-zµμ]+)/g, total = 0, count = 0, sign = duration[0] === '-' ? -1 : 1, value;
        while (true) {
            var match = regex.exec(duration);
            if (!match) {
                break;
            }
            var unit = match[2];
            value = Math.abs(parseFloat(match[1]));
            count++;
            if (isNaN(value)) {
                throw new Error("invalid duration");
            }
            if (typeof unitMap[unit] === "undefined") {
                throw new Error("invalid unit: " + unit);
            }
            total += value * unitMap[unit];
        }
        if (count === 0) {
            throw new Error("invalid duration");
        }
        return new Duration(Math.floor(total) * sign);
    };
    Duration.valueOf = function (duration) {
        return new Duration(duration).valueOf();
    };
    Duration.prototype.truncate = function (duration) {
        var ms = Duration.valueOf(duration);
        return new Duration(ms * Math.round(this._milliseconds / ms));
    };
    Duration.prototype.isGreaterThan = function (duration) {
        return this.valueOf() > Duration.valueOf(duration);
    };
    Duration.prototype.isLessThan = function (duration) {
        return this.valueOf() < Duration.valueOf(duration);
    };
    Duration.prototype.isEqualTo = function (duration) {
        return this.valueOf() === Duration.valueOf(duration);
    };
    Duration.prototype.after = function (date) {
        return new Date(date.valueOf() + this._milliseconds);
    };
    Duration.since = function (date) {
        return new Duration(new Date().valueOf() - date.valueOf());
    };
    Duration.until = function (date) {
        return new Duration(date.valueOf() - new Date().valueOf());
    };
    Duration.between = function (a, b) {
        return new Duration(b.valueOf() - a.valueOf());
    };
    Duration.add = function (a, b) {
        return new Duration(Duration.valueOf(a) + Duration.valueOf(b));
    };
    Duration.subtract = function (a, b) {
        return new Duration(Duration.valueOf(a) - Duration.valueOf(b));
    };
    Duration.multiply = function (a, b) {
        return new Duration(Duration.valueOf(a) * Duration.valueOf(b));
    };
    Duration.divide = function (a, b) {
        return Duration.valueOf(a) / Duration.valueOf(b);
    };
    Duration.millisecond = new Duration(millisecond);
    Duration.second = new Duration(second);
    Duration.minute = new Duration(minute);
    Duration.hour = new Duration(hour);
    Duration.day = new Duration(day);
    Duration.week = new Duration(week);
    Duration.nanoseconds = function (ns) {
        var ms = Math.floor(ns / 1000000);
        return new Duration(ms);
    };
    return Duration;
}());
exports.Duration = Duration;
exports.default = Duration;
