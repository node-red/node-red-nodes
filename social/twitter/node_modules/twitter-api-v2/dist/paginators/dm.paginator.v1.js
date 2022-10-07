"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeDmV1Paginator = exports.DmEventsV1Paginator = void 0;
const paginator_v1_1 = require("./paginator.v1");
class DmEventsV1Paginator extends paginator_v1_1.CursoredV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'direct_messages/events/list.json';
    }
    refreshInstanceFromResult(response, isNextPage) {
        const result = response.data;
        this._rateLimit = response.rateLimit;
        if (isNextPage) {
            this._realData.events.push(...result.events);
            this._realData.next_cursor = result.next_cursor;
        }
    }
    getPageLengthFromRequest(result) {
        return result.data.events.length;
    }
    getItemArray() {
        return this.events;
    }
    /**
     * Events returned by paginator.
     */
    get events() {
        return this._realData.events;
    }
}
exports.DmEventsV1Paginator = DmEventsV1Paginator;
class WelcomeDmV1Paginator extends paginator_v1_1.CursoredV1Paginator {
    constructor() {
        super(...arguments);
        this._endpoint = 'direct_messages/welcome_messages/list.json';
    }
    refreshInstanceFromResult(response, isNextPage) {
        const result = response.data;
        this._rateLimit = response.rateLimit;
        if (isNextPage) {
            this._realData.welcome_messages.push(...result.welcome_messages);
            this._realData.next_cursor = result.next_cursor;
        }
    }
    getPageLengthFromRequest(result) {
        return result.data.welcome_messages.length;
    }
    getItemArray() {
        return this.welcomeMessages;
    }
    get welcomeMessages() {
        return this._realData.welcome_messages;
    }
}
exports.WelcomeDmV1Paginator = WelcomeDmV1Paginator;
