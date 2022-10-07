import TwitterApiv1ReadWrite from '../v1/client.v1.write';
import TwitterApiv2ReadWrite from '../v2/client.v2.write';
import TwitterApiReadOnly from './readonly';
/**
 * Twitter v1.1 and v2 API client.
 */
export default class TwitterApiReadWrite extends TwitterApiReadOnly {
    protected _v1?: TwitterApiv1ReadWrite;
    protected _v2?: TwitterApiv2ReadWrite;
    get v1(): TwitterApiv1ReadWrite;
    get v2(): TwitterApiv2ReadWrite;
    /**
     * Get a client with read only rights.
     */
    get readOnly(): TwitterApiReadOnly;
}
