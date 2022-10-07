"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyResponseHooks = exports.hasRequestErrorPlugins = void 0;
const types_1 = require("../types");
/* Plugin helpers */
function hasRequestErrorPlugins(client) {
    var _a;
    if (!((_a = client.clientSettings.plugins) === null || _a === void 0 ? void 0 : _a.length)) {
        return false;
    }
    for (const plugin of client.clientSettings.plugins) {
        if (plugin.onRequestError || plugin.onResponseError) {
            return true;
        }
    }
    return false;
}
exports.hasRequestErrorPlugins = hasRequestErrorPlugins;
async function applyResponseHooks(requestParams, computedParams, requestOptions, error) {
    let override;
    if (error instanceof types_1.ApiRequestError || error instanceof types_1.ApiPartialResponseError) {
        override = await this.applyPluginMethod('onRequestError', {
            client: this,
            url: this.getUrlObjectFromUrlString(requestParams.url),
            params: requestParams,
            computedParams,
            requestOptions,
            error,
        });
    }
    else if (error instanceof types_1.ApiResponseError) {
        override = await this.applyPluginMethod('onResponseError', {
            client: this,
            url: this.getUrlObjectFromUrlString(requestParams.url),
            params: requestParams,
            computedParams,
            requestOptions,
            error,
        });
    }
    if (override && override instanceof types_1.TwitterApiPluginResponseOverride) {
        return override.value;
    }
    return Promise.reject(error);
}
exports.applyResponseHooks = applyResponseHooks;
