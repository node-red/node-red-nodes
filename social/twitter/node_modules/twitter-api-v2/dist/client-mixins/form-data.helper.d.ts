/// <reference types="node" />
declare type TStringable = {
    toString(): string;
};
export declare class FormDataHelper {
    protected _boundary: string;
    protected _chunks: Buffer[];
    protected _footerChunk?: Buffer;
    protected static readonly LINE_BREAK = "\r\n";
    protected static readonly DEFAULT_CONTENT_TYPE = "application/octet-stream";
    protected bodyAppend(...values: (Buffer | string)[]): void;
    append(field: string, value: Buffer | string | TStringable, contentType?: string): void;
    getHeaders(): {
        'content-type': string;
    };
    /** Length of form-data (including footer length). */
    protected getLength(): number;
    getBuffer(): Buffer;
    protected getBoundary(): string;
    protected generateBoundary(): void;
    protected getMultipartHeader(field: string, value: string | Buffer, contentType?: string): string;
    protected getMultipartFooter(): Buffer;
}
export {};
