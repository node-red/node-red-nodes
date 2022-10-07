export interface SharedPromise<T> {
    value: T | undefined;
    promise: Promise<T>;
}
export declare function sharedPromise<T>(getter: () => Promise<T>): SharedPromise<T>;
export declare function arrayWrap<T>(value: T | T[]): T[];
export declare function trimUndefinedProperties(object: any): void;
export declare function isTweetStreamV2ErrorPayload(payload: any): boolean;
export declare function hasMultipleItems(item: string | string[]): boolean;
export interface IDeprecationWarning {
    instance: string;
    method: string;
    problem: string;
    resolution: string;
}
export declare function safeDeprecationWarning(message: IDeprecationWarning): void;
