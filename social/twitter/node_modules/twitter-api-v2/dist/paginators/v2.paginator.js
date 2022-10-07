"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineV2Paginator = exports.TwitterV2Paginator = void 0;
const includes_v2_helper_1 = require("../v2/includes.v2.helper");
const TwitterPaginator_1 = require("./TwitterPaginator");
/** A generic PreviousableTwitterPaginator with common v2 helper methods. */
class TwitterV2Paginator extends TwitterPaginator_1.PreviousableTwitterPaginator {
    updateIncludes(data) {
        // Update errors
        if (data.errors) {
            if (!this._realData.errors) {
                this._realData.errors = [];
            }
            this._realData.errors = [...this._realData.errors, ...data.errors];
        }
        // Update includes
        if (!data.includes) {
            return;
        }
        if (!this._realData.includes) {
            this._realData.includes = {};
        }
        const includesRealData = this._realData.includes;
        for (const [includeKey, includeArray] of Object.entries(data.includes)) {
            if (!includesRealData[includeKey]) {
                includesRealData[includeKey] = [];
            }
            includesRealData[includeKey] = [
                ...includesRealData[includeKey],
                ...includeArray,
            ];
        }
    }
    /** Throw if the current paginator is not usable. */
    assertUsable() {
        if (this.unusable) {
            throw new Error('Unable to use this paginator to fetch more data, as it does not contain any metadata.' +
                ' Check .errors property for more details.');
        }
    }
    get meta() {
        return this._realData.meta;
    }
    get includes() {
        var _a;
        if (!((_a = this._realData) === null || _a === void 0 ? void 0 : _a.includes)) {
            return new includes_v2_helper_1.TwitterV2IncludesHelper(this._realData);
        }
        if (this._includesInstance) {
            return this._includesInstance;
        }
        return this._includesInstance = new includes_v2_helper_1.TwitterV2IncludesHelper(this._realData);
    }
    get errors() {
        var _a;
        return (_a = this._realData.errors) !== null && _a !== void 0 ? _a : [];
    }
    /** `true` if this paginator only contains error payload and no metadata found to consume data. */
    get unusable() {
        return this.errors.length > 0 && !this._realData.meta && !this._realData.data;
    }
}
exports.TwitterV2Paginator = TwitterV2Paginator;
/** A generic TwitterV2Paginator able to consume v2 timelines that use max_results and pagination tokens. */
class TimelineV2Paginator extends TwitterV2Paginator {
    refreshInstanceFromResult(response, isNextPage) {
        var _a;
        const result = response.data;
        const resultData = (_a = result.data) !== null && _a !== void 0 ? _a : [];
        this._rateLimit = response.rateLimit;
        if (!this._realData.data) {
            this._realData.data = [];
        }
        if (isNextPage) {
            this._realData.meta.result_count += result.meta.result_count;
            this._realData.meta.next_token = result.meta.next_token;
            this._realData.data.push(...resultData);
        }
        else {
            this._realData.meta.result_count += result.meta.result_count;
            this._realData.meta.previous_token = result.meta.previous_token;
            this._realData.data.unshift(...resultData);
        }
        this.updateIncludes(result);
    }
    getNextQueryParams(maxResults) {
        this.assertUsable();
        return {
            ...this.injectQueryParams(maxResults),
            pagination_token: this._realData.meta.next_token,
        };
    }
    getPreviousQueryParams(maxResults) {
        this.assertUsable();
        return {
            ...this.injectQueryParams(maxResults),
            pagination_token: this._realData.meta.previous_token,
        };
    }
    getPageLengthFromRequest(result) {
        var _a, _b;
        return (_b = (_a = result.data.data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    }
    isFetchLastOver(result) {
        var _a;
        return !((_a = result.data.data) === null || _a === void 0 ? void 0 : _a.length) || !this.canFetchNextPage(result.data);
    }
    canFetchNextPage(result) {
        var _a;
        return !!((_a = result.meta) === null || _a === void 0 ? void 0 : _a.next_token);
    }
}
exports.TimelineV2Paginator = TimelineV2Paginator;
