export class Emitter {
    constructor({ interceptors, } = {}) {
        Object.defineProperty(this, "collectable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "interceptors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.interceptors = interceptors ?? {};
    }
    subscribe(event, listener, historic = false) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        if (!this.isSubscribed(event, listener)) {
            this.listeners[event]?.push(listener);
            if (historic && this.collectable[event]) {
                const buffer = this.collectable[event];
                this.collectable[event] = [];
                buffer?.forEach((args) => listener(...args));
            }
        }
    }
    subscribeOnce(event, historic = false) {
        return new Promise((resolve) => {
            let resolved = false;
            const listener = (...args) => {
                if (!resolved) {
                    resolved = true;
                    this.unSubscribe(event, listener);
                    resolve(args);
                }
            };
            this.subscribe(event, listener, historic);
        });
    }
    unSubscribe(event, listener) {
        if (this.listeners[event]) {
            const index = this.listeners[event]?.findIndex((v) => v == listener);
            if (index) {
                this.listeners[event]?.splice(index, 1);
            }
        }
    }
    isSubscribed(event, listener) {
        return !!this.listeners[event]?.includes(listener);
    }
    async emit(event, args, collectable = false) {
        const interceptor = this.interceptors[event];
        args = interceptor ? await interceptor(...args) : args;
        if (this.listeners[event]?.length == 0 && collectable) {
            if (!this.collectable[event]) {
                this.collectable[event] = [];
            }
            this.collectable[event]?.push(args);
        }
        this.listeners[event]?.forEach((listener) => listener(...args));
    }
    reset({ collectable, listeners, }) {
        if (Array.isArray(collectable)) {
            collectable.forEach((k) => delete this.collectable[k]);
        }
        else if (typeof collectable === "string") {
            delete this.collectable[collectable];
        }
        else if (collectable !== false) {
            this.collectable = {};
        }
        if (Array.isArray(listeners)) {
            listeners.forEach((k) => delete this.listeners[k]);
        }
        else if (typeof listeners === "string") {
            delete this.listeners[listeners];
        }
        else if (listeners !== false) {
            this.listeners = {};
        }
    }
    scanListeners(filter) {
        let listeners = Object.keys(this.listeners);
        if (filter)
            listeners = listeners.filter(filter);
        return listeners;
    }
}
//# sourceMappingURL=emitter.js.map