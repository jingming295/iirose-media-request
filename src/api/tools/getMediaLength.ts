import getVideoDuration from 'get-video-duration';

/**
 * @description 获取媒体长度
 */
export class GetMediaLength
{
    /**
     * 获取媒体长度（秒）
     * @param mediaurl 媒体链接
     */
    async mediaLengthInSec(mediaurl: string): Promise<number>
    {
        try
        {
            const durationInSeconds = await getVideoDuration(mediaurl);
            return durationInSeconds;
        } catch (error)
        {
            console.log(error);
            return 1;
        }
    }
}
