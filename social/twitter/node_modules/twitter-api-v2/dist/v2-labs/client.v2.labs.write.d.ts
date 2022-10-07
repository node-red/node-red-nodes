import TwitterApiv2LabsReadOnly from './client.v2.labs.read';
/**
 * Base Twitter v2 labs client with read/write rights.
 */
export default class TwitterApiv2LabsReadWrite extends TwitterApiv2LabsReadOnly {
    protected _prefix: string;
    /**
     * Get a client with only read rights.
     */
    get readOnly(): TwitterApiv2LabsReadOnly;
}
