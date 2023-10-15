import { MediaParsing } from ".";
import { NeteaseApi } from '../NeteaseAPI';

/**
 * 主要处理网易云的网站
 */
export class Netease extends MediaParsing
{
    /**
     * 处理网易云的媒体
     * @returns mediaData
     */
    public async handleNeteaseMedia(originUrl: string)
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const neteaseApi = new NeteaseApi();
        try
        {
            let id: string | null;
            if (originUrl.includes('http') && originUrl.includes('song'))
            {
                const match1 = originUrl.match(/id=(\d+)/);
                const match2 = originUrl.match(/\/song\/(\d+)/);

                id = match1 ? match1[1] : (match2 ? match2[1] : null);
                if (id === null)
                {
                    const mediaData = this.returnErrorMediaData('暂不支持');
                    return mediaData;
                }
            }
            else
            {
                const mediaData = this.returnErrorMediaData('暂不支持');
                return mediaData;
            }
            let songData = await neteaseApi.getNeteaseMusicDetail(id);
            songData = songData.songs[0];
            let songResource = await neteaseApi.getSongResource(id);
            songResource = songResource[0];
            url = await this.getRedirectUrl(songResource.url);
            type = 'music';
            name = songData.name;
            cover = songResource.pic;
            bitRate = songData.hMusic ? (songData.hMusic.bitrate / 1000) : 128; // 如果 songData.hMusic 存在则使用其比特率，否则使用默认值 128
            signer = songData.artists[0].name;
            duration = songData.duration / 1000;
            const mediaData = this.returnCompleteMediaData(type, name, signer, cover, url, duration, bitRate);
            return mediaData;
        } catch (error)
        {
            const mediaData = this.returnErrorMediaData((error as Error).message);
            return mediaData;
        }

    }
}