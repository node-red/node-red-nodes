/// <reference types="node" />
import type { RequestOptions } from 'https';
import type { TBodyMode, TRequestBody, TRequestQuery, TRequestStringQuery } from '../types/request-maker.mixin.types';
export declare class RequestParamHelpers {
    static readonly JSON_1_1_ENDPOINTS: Set<string>;
    static formatQueryToString(query: TRequestQuery): TRequestStringQuery;
    static autoDetectBodyType(url: URL): TBodyMode;
    static addQueryParamsToUrl(url: URL, query: TRequestQuery): void;
    static constructBodyParams(body: TRequestBody, headers: Record<string, string>, mode: TBodyMode): string | Buffer;
    static setBodyLengthHeader(options: RequestOptions, body: string | Buffer): void;
    static isOAuthSerializable(item: any): boolean;
    static mergeQueryAndBodyForOAuth(query: TRequestQuery, body: TRequestBody): any;
    static moveUrlQueryParamsIntoObject(url: URL, query: TRequestQuery): URL;
    /**
     * Replace URL parameters available in pathname, like `:id`, with data given in `parameters`:
     * `https://twitter.com/:id.json` + `{ id: '20' }` => `https://twitter.com/20.json`
     */
    static applyRequestParametersToUrl(url: URL, parameters: TRequestQuery): URL;
}
export default RequestParamHelpers;
