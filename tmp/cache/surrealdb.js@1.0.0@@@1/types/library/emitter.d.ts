export type Listener<Args extends unknown[] = unknown[]> = (...args: Args) => unknown;
export type UnknownEvents = Record<string, unknown[]>;
export declare class Emitter<Events extends UnknownEvents = UnknownEvents> {
    private collectable;
    private listeners;
    private readonly interceptors;
    constructor({ interceptors, }?: {
        interceptors?: Partial<{
            [K in keyof Events]: (...args: Events[K]) => Promise<Events[K]>;
        }>;
    });
    subscribe<Event extends keyof Events>(event: Event, listener: Listener<Events[Event]>, historic?: boolean): void;
    subscribeOnce<Event extends keyof Events>(event: Event, historic?: boolean): Promise<Events[Event]>;
    unSubscribe<Event extends keyof Events>(event: Event, listener: Listener<Events[Event]>): void;
    isSubscribed<Event extends keyof Events>(event: Event, listener: Listener<Events[Event]>): boolean;
    emit<Event extends keyof Events>(event: Event, args: Events[Event], collectable?: boolean): Promise<void>;
    reset({ collectable, listeners, }: {
        collectable?: boolean | keyof Events | (keyof Events)[];
        listeners?: boolean | keyof Events | (keyof Events)[];
    }): void;
    scanListeners(filter?: (k: keyof Events) => boolean): (keyof Events)[];
}
