import TwitterApiSubClient from '../client.subclient';
/**
 * Base Twitter v2 labs client with only read right.
 */
export default class TwitterApiv2LabsReadOnly extends TwitterApiSubClient {
    protected _prefix: string;
}
