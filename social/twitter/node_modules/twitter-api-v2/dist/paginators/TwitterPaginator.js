"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviousableTwitterPaginator = exports.TwitterPaginator = void 0;
/** TwitterPaginator: able to get consume data from initial request, then fetch next data sequentially. */
class TwitterPaginator {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor({ realData, rateLimit, instance, queryParams, sharedParams }) {
        this._maxResultsWhenFetchLast = 100;
        this._realData = realData;
        this._rateLimit = rateLimit;
        this._instance = instance;
        this._queryParams = queryParams;
        this._sharedParams = sharedParams;
    }
    get _isRateLimitOk() {
        if (!this._rateLimit) {
            return true;
        }
        const resetDate = this._rateLimit.reset * 1000;
        if (resetDate < Date.now()) {
            return true;
        }
        return this._rateLimit.remaining > 0;
    }
    makeRequest(queryParams) {
        return this._instance.get(this.getEndpoint(), queryParams, { fullResponse: true, params: this._sharedParams });
    }
    makeNewInstanceFromResult(result, queryParams) {
        // Construct a subclass
        return new this.constructor({
            realData: result.data,
            rateLimit: result.rateLimit,
            instance: this._instance,
            queryParams,
            sharedParams: this._sharedParams,
        });
    }
    getEndpoint() {
        return this._endpoint;
    }
    injectQueryParams(maxResults) {
        return {
            ...(maxResults ? { max_results: maxResults } : {}),
            ...this._queryParams,
        };
    }
    /* ---------------------- */
    /* Real paginator methods */
    /* ---------------------- */
    /**
     * Next page.
     */
    async next(maxResults) {
        const queryParams = this.getNextQueryParams(maxResults);
        const result = await this.makeRequest(queryParams);
        return this.makeNewInstanceFromResult(result, queryParams);
    }
    /**
     * Next page, but store it in current instance.
     */
    async fetchNext(maxResults) {
        const queryParams = this.getNextQueryParams(maxResults);
        const result = await this.makeRequest(queryParams);
        // Await in case of async sub-methods
        await this.refreshInstanceFromResult(result, true);
        return this;
    }
    /**
     * Fetch up to {count} items after current page,
     * as long as rate limit is not hit and Twitter has some results
     */
    async fetchLast(count = Infinity) {
        let queryParams = this.getNextQueryParams(this._maxResultsWhenFetchLast);
        let resultCount = 0;
        // Break at rate limit limit
        while (resultCount < count && this._isRateLimitOk) {
            const response = await this.makeRequest(queryParams);
            await this.refreshInstanceFromResult(response, true);
            resultCount += this.getPageLengthFromRequest(response);
            if (this.isFetchLastOver(response)) {
                break;
            }
            queryParams = this.getNextQueryParams(this._maxResultsWhenFetchLast);
        }
        return this;
    }
    get rateLimit() {
        var _a;
        return { ...(_a = this._rateLimit) !== null && _a !== void 0 ? _a : {} };
    }
    /** Get raw data returned by Twitter API. */
    get data() {
        return this._realData;
    }
    get done() {
        return !this.canFetchNextPage(this._realData);
    }
    /**
     * Iterate over currently fetched items.
     */
    *[Symbol.iterator]() {
        yield* this.getItemArray();
    }
    /**
     * Iterate over items "undefinitely" (until rate limit is hit / they're no more items available)
     * This will **mutate the current instance** and fill data, metas, etc. inside this instance.
     *
     * If you need to handle concurrent requests, or you need to rely on immutability, please use `.fetchAndIterate()` instead.
     */
    async *[Symbol.asyncIterator]() {
        yield* this.getItemArray();
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let paginator = this;
        let canFetchNextPage = this.canFetchNextPage(this._realData);
        while (canFetchNextPage && this._isRateLimitOk && paginator.getItemArray().length > 0) {
            const next = await paginator.next(this._maxResultsWhenFetchLast);
            // Store data into current instance [needed to access includes and meta]
            this.refreshInstanceFromResult({ data: next._realData, headers: {}, rateLimit: next._rateLimit }, true);
            canFetchNextPage = this.canFetchNextPage(next._realData);
            const items = next.getItemArray();
            yield* items;
            paginator = next;
        }
    }
    /**
     * Iterate over items "undefinitely" without modifying the current instance (until rate limit is hit / they're no more items available)
     *
     * This will **NOT** mutate the current instance, meaning that current instance will not inherit from `includes` and `meta` (v2 API only).
     * Use `Symbol.asyncIterator` (`for-await of`) to directly access items with current instance mutation.
     */
    async *fetchAndIterate() {
        for (const item of this.getItemArray()) {
            yield [item, this];
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let paginator = this;
        let canFetchNextPage = this.canFetchNextPage(this._realData);
        while (canFetchNextPage && this._isRateLimitOk && paginator.getItemArray().length > 0) {
            const next = await paginator.next(this._maxResultsWhenFetchLast);
            // Store data into current instance [needed to access includes and meta]
            this.refreshInstanceFromResult({ data: next._realData, headers: {}, rateLimit: next._rateLimit }, true);
            canFetchNextPage = this.canFetchNextPage(next._realData);
            for (const item of next.getItemArray()) {
                yield [item, next];
            }
            this._rateLimit = next._rateLimit;
            paginator = next;
        }
    }
}
exports.TwitterPaginator = TwitterPaginator;
/** PreviousableTwitterPaginator: a TwitterPaginator able to get consume data from both side, next and previous. */
class PreviousableTwitterPaginator extends TwitterPaginator {
    /**
     * Previous page (new tweets)
     */
    async previous(maxResults) {
        const queryParams = this.getPreviousQueryParams(maxResults);
        const result = await this.makeRequest(queryParams);
        return this.makeNewInstanceFromResult(result, queryParams);
    }
    /**
     * Previous page, but in current instance.
     */
    async fetchPrevious(maxResults) {
        const queryParams = this.getPreviousQueryParams(maxResults);
        const result = await this.makeRequest(queryParams);
        await this.refreshInstanceFromResult(result, false);
        return this;
    }
}
exports.PreviousableTwitterPaginator = PreviousableTwitterPaginator;
exports.default = TwitterPaginator;
