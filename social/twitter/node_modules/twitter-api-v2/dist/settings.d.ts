export interface ITwitterApiV2Settings {
    debug: boolean;
    deprecationWarnings: boolean;
    logger: ITwitterApiV2SettingsLogger;
}
export interface ITwitterApiV2SettingsLogger {
    log(message: string, payload?: any): void;
}
export declare const TwitterApiV2Settings: ITwitterApiV2Settings;
