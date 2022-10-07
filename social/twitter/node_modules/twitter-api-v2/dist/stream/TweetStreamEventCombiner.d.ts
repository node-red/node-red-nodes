/// <reference types="node" />
import { EventEmitter } from 'events';
import type TweetStream from './TweetStream';
export declare class TweetStreamEventCombiner<T> extends EventEmitter {
    private stream;
    private stack;
    private onceNewEvent;
    constructor(stream: TweetStream<T>);
    /** Returns a new `Promise` that will `resolve` on next event (`data` or any sort of error). */
    nextEvent(): Promise<{
        type: "error";
        payload?: any;
    } | {
        type: "data";
        payload: T;
    }>;
    /** Returns `true` if there's something in the stack. */
    hasStack(): boolean;
    /** Returns stacked data events, and clean the stack. */
    popStack(): T[];
    /** Cleanup all the listeners attached on stream. */
    destroy(): void;
    private emitEvent;
    private onStreamError;
    private onStreamData;
}
export default TweetStreamEventCombiner;
