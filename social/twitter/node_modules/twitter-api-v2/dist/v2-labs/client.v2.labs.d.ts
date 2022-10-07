import TwitterApiv2LabsReadWrite from './client.v2.labs.write';
/**
 * Twitter v2 labs client with all rights (read/write/DMs)
 */
export declare class TwitterApiv2Labs extends TwitterApiv2LabsReadWrite {
    protected _prefix: string;
    /**
     * Get a client with read/write rights.
     */
    get readWrite(): TwitterApiv2LabsReadWrite;
}
export default TwitterApiv2Labs;
