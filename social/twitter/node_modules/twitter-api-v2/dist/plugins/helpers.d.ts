/// <reference types="node" />
import type { ClientRequestArgs } from 'http';
import type { ClientRequestMaker } from '../client-mixins/request-maker.mixin';
import { IGetHttpRequestArgs } from '../types';
import type { IComputedHttpRequestArgs } from '../types/request-maker.mixin.types';
export declare function hasRequestErrorPlugins(client: ClientRequestMaker): boolean;
export declare function applyResponseHooks(this: ClientRequestMaker, requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, requestOptions: Partial<ClientRequestArgs>, error: any): Promise<any>;
