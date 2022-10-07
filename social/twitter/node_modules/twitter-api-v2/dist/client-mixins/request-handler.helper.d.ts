/// <reference types="node" />
import type { Socket } from 'net';
import type { IncomingMessage, ClientRequest } from 'http';
import TweetStream from '../stream/TweetStream';
import { ApiPartialResponseError, ApiRequestError, ApiResponseError } from '../types';
import type { ErrorV1, ErrorV2, TwitterRateLimit, TwitterResponse } from '../types';
import type { TRequestFullData, TRequestFullStreamData, TResponseParseMode } from '../types/request-maker.mixin.types';
import * as zlib from 'zlib';
import { Readable } from 'stream';
declare type TRequestReadyPayload = {
    req: ClientRequest;
    res: Readable;
    originalResponse: IncomingMessage;
    requestData: TRequestFullData | TRequestFullStreamData;
};
declare type TReadyRequestResolver = (value: TRequestReadyPayload) => void;
declare type TResponseResolver<T> = (value: TwitterResponse<T>) => void;
declare type TRequestRejecter = (error: ApiRequestError) => void;
declare type TResponseRejecter = (error: ApiResponseError | ApiPartialResponseError) => void;
interface IBuildErrorParams {
    res: IncomingMessage;
    data: any;
    rateLimit?: TwitterRateLimit;
    code: number;
}
export declare class RequestHandlerHelper<T> {
    protected requestData: TRequestFullData | TRequestFullStreamData;
    protected req: ClientRequest;
    protected res: IncomingMessage;
    protected requestErrorHandled: boolean;
    protected responseData: Buffer[];
    constructor(requestData: TRequestFullData | TRequestFullStreamData);
    get hrefPathname(): string;
    protected isCompressionDisabled(): boolean;
    protected isFormEncodedEndpoint(): boolean;
    protected createRequestError(error: Error): ApiRequestError;
    protected createPartialResponseError(error: Error, abortClose: boolean): ApiPartialResponseError;
    protected formatV1Errors(errors: ErrorV1[]): string;
    protected formatV2Error(error: ErrorV2): string;
    protected createResponseError({ res, data, rateLimit, code }: IBuildErrorParams): ApiResponseError;
    protected getResponseDataStream(res: IncomingMessage): IncomingMessage | zlib.BrotliDecompress;
    protected detectResponseType(res: IncomingMessage): TResponseParseMode;
    protected getParsedResponse(res: IncomingMessage): any;
    protected getRateLimitFromResponse(res: IncomingMessage): TwitterRateLimit | undefined;
    protected onSocketEventHandler(reject: TRequestRejecter, socket: Socket): void;
    protected onSocketCloseHandler(reject: TRequestRejecter): void;
    protected requestErrorHandler(reject: TRequestRejecter, requestError: Error): void;
    protected timeoutErrorHandler(): void;
    protected classicResponseHandler(resolve: TResponseResolver<T>, reject: TResponseRejecter, res: IncomingMessage): void;
    protected onResponseEndHandler(resolve: TResponseResolver<T>, reject: TResponseRejecter): void;
    protected onResponseCloseHandler(resolve: TResponseResolver<T>, reject: TResponseRejecter): void;
    protected streamResponseHandler(resolve: TReadyRequestResolver, reject: TResponseRejecter, res: IncomingMessage): void;
    protected debugRequest(): void;
    protected buildRequest(): void;
    protected registerRequestEventDebugHandlers(req: ClientRequest): void;
    makeRequest(): Promise<TwitterResponse<T>>;
    makeRequestAsStream(): Promise<TweetStream<T>>;
    makeRequestAndResolveWhenReady(): Promise<TRequestReadyPayload>;
}
export default RequestHandlerHelper;
