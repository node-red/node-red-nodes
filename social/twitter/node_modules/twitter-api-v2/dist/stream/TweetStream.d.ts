/// <reference types="node" />
import { EventEmitter } from 'events';
import type { IncomingMessage, ClientRequest } from 'http';
import type { Readable } from 'stream';
import { ETwitterStreamEvent } from '../types';
import { TRequestFullStreamData } from '../types/request-maker.mixin.types';
import TweetStreamParser from './TweetStreamParser';
interface ITweetStreamError {
    type: ETwitterStreamEvent.ConnectionError | ETwitterStreamEvent.TweetParseError | ETwitterStreamEvent.ReconnectError | ETwitterStreamEvent.DataError | ETwitterStreamEvent.ConnectError;
    error: any;
    message?: string;
}
export interface IConnectTweetStreamParams {
    autoReconnect: boolean;
    autoReconnectRetries: number | 'unlimited';
    /** Check for 'lost connection' status every `keepAliveTimeout` milliseconds. Defaults to 2 minutes (`120000`). */
    keepAliveTimeout: number | 'disable';
    nextRetryTimeout?: TStreamConnectRetryFn;
}
export interface IWithConnectionTweetStream {
    req: ClientRequest;
    res: Readable;
    originalResponse: IncomingMessage;
}
/** Returns a number of milliseconds to wait for {tryOccurence} (starting from 1) */
export declare type TStreamConnectRetryFn = (tryOccurence: number, error?: any) => number;
export declare class TweetStream<T = any> extends EventEmitter {
    protected requestData: TRequestFullStreamData;
    autoReconnect: boolean;
    autoReconnectRetries: number;
    keepAliveTimeoutMs: number;
    nextRetryTimeout: TStreamConnectRetryFn;
    protected retryTimeout?: NodeJS.Timeout;
    protected keepAliveTimeout?: NodeJS.Timeout;
    protected parser: TweetStreamParser;
    protected connectionProcessRunning: boolean;
    protected req?: ClientRequest;
    protected res?: Readable;
    protected originalResponse?: IncomingMessage;
    constructor(requestData: TRequestFullStreamData, connection?: IWithConnectionTweetStream);
    on(event: ETwitterStreamEvent.Data, handler: (data: T) => any): this;
    on(event: ETwitterStreamEvent.DataError, handler: (error: any) => any): this;
    on(event: ETwitterStreamEvent.Error, handler: (errorPayload: ITweetStreamError) => any): this;
    on(event: ETwitterStreamEvent.Connected, handler: () => any): this;
    on(event: ETwitterStreamEvent.ConnectionLost, handler: () => any): this;
    on(event: ETwitterStreamEvent.ConnectionError, handler: (error: Error) => any): this;
    on(event: ETwitterStreamEvent.TweetParseError, handler: (error: Error) => any): this;
    on(event: ETwitterStreamEvent.ConnectionClosed, handler: () => any): this;
    on(event: ETwitterStreamEvent.DataKeepAlive, handler: () => any): this;
    on(event: ETwitterStreamEvent.ReconnectAttempt, handler: (tries: number) => any): this;
    on(event: ETwitterStreamEvent.ReconnectError, handler: (tries: number) => any): this;
    on(event: ETwitterStreamEvent.ReconnectLimitExceeded, handler: () => any): this;
    on(event: ETwitterStreamEvent.Reconnected, handler: () => any): this;
    on(event: string | symbol, handler: (...args: any[]) => any): this;
    protected initEventsFromRequest(): void;
    protected initEventsFromParser(): void;
    protected resetKeepAliveTimeout(): void;
    protected onKeepAliveTimeout(): void;
    protected unbindTimeouts(): void;
    protected unbindKeepAliveTimeout(): void;
    protected unbindRetryTimeout(): void;
    protected closeWithoutEmit(): void;
    /** Terminate connection to Twitter. */
    close(): void;
    /** Unbind all listeners, and close connection. */
    destroy(): void;
    /**
     * Make a new request that creates a new `TweetStream` instance with
     * the same parameters, and bind current listeners to new stream.
     */
    clone(): Promise<TweetStream<T>>;
    /** Start initial stream connection, setup options on current instance and returns itself. */
    connect(options?: Partial<IConnectTweetStreamParams>): Promise<this>;
    /** Make a new request to (re)connect to Twitter. */
    reconnect(): Promise<void>;
    protected onConnectionError(retryOccurence?: number): Promise<void>;
    protected makeAutoReconnectRetry(retryOccurence: number, error: any): void;
    [Symbol.asyncIterator](): AsyncGenerator<T, void, undefined>;
}
export default TweetStream;
