import TwitterApiv1 from '../v1/client.v1';
import TwitterApiv2 from '../v2/client.v2';
import TwitterApiReadWrite from './readwrite';
/**
 * Twitter v1.1 and v2 API client.
 */
export declare class TwitterApi extends TwitterApiReadWrite {
    protected _v1?: TwitterApiv1;
    protected _v2?: TwitterApiv2;
    get v1(): TwitterApiv1;
    get v2(): TwitterApiv2;
    /**
     * Get a client with read/write rights.
     */
    get readWrite(): TwitterApiReadWrite;
    static getErrors(error: any): (import("../types").ErrorV1 | import("../types").ErrorV2)[];
    /** Extract another image size than obtained in a `profile_image_url` or `profile_image_url_https` field of a user object. */
    static getProfileImageInSize(profileImageUrl: string, size: 'normal' | 'bigger' | 'mini' | 'original'): string;
}
export { default as TwitterApiReadWrite } from './readwrite';
export { default as TwitterApiReadOnly } from './readonly';
export default TwitterApi;
