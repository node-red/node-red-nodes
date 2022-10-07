import TwitterApiv2ReadWrite from './client.v2.write';
import TwitterApiv2Labs from '../v2-labs/client.v2.labs';
/**
 * Twitter v2 client with all rights (read/write/DMs)
 */
export declare class TwitterApiv2 extends TwitterApiv2ReadWrite {
    protected _prefix: string;
    protected _labs?: TwitterApiv2Labs;
    /**
     * Get a client with read/write rights.
     */
    get readWrite(): TwitterApiv2ReadWrite;
    /**
     * Get a client for v2 labs endpoints.
     */
    get labs(): TwitterApiv2Labs;
}
export default TwitterApiv2;
