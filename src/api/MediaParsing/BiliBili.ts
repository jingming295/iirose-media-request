import { MediaParsing } from ".";
import { BiliBiliApi } from "../BilibiliAPI";


/**
 * 主要处理bilibili的网站
 */
export class BiliBili extends MediaParsing
{

    /**
     * 处理Bangumi的媒体
     * @returns mediaData
     */
    public async handleBilibiliBangumi(originUrl: string, biliBiliSessData: string, biliBiliqn: number)
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const biliBiliApi = new BiliBiliApi();
        const regex = /\/ep(\d+)/;
        const match = originUrl.match(regex);
        if (match)
        {
            const ep: number = parseInt(match[1], 10);
            const bangumiInfo = await biliBiliApi.getBangumiData(ep, biliBiliSessData);
            let bangumiStream = await biliBiliApi.getBangumiStream(ep, biliBiliSessData, biliBiliqn);
            if (!bangumiInfo || !bangumiStream)
            {
                const mediaData = this.returnErrorMediaData(['获取番剧信息失败，可能接口已经改变']);
                return mediaData;
            }
            while (await this.checkResponseStatus(bangumiStream.durl[0].url) === false)
            {
                biliBiliqn = this.changeBilibiliQn(biliBiliqn);
                bangumiStream = await biliBiliApi.getBangumiStream(ep, biliBiliSessData, biliBiliqn);
                if (biliBiliqn === 6) break;
            }
            const targetEpisodeInfo = bangumiInfo.episodes.find((episodes: { ep_id: number; }) => episodes.ep_id === ep);
            if (targetEpisodeInfo)
            {
                bitRate = this.getQuality(bangumiStream.quality);
                cover = targetEpisodeInfo.cover;
                duration = (targetEpisodeInfo.duration / 1000) + 1;
                url = bangumiStream.durl[0].url;
                name = targetEpisodeInfo.share_copy;
                type = 'video';
                signer = bangumiInfo.up_info.uname || '未定';

                const mediaData = this.returnCompleteMediaData([type], [name], [signer], [cover], [url], [duration], [bitRate]);

                // console.log(bangumiInfo.episodes)
                // console.log(bangumiStream)
                return mediaData;
            } else
            {
                const mediaData = this.returnErrorMediaData(['无法找到番剧']);
                return mediaData;
            }


        }
        const mediaData = this.returnErrorMediaData(['链接中没有发现ep号，请重新拿到链接']);
        return mediaData;
    }

    /**
     * 处理bilibili的媒体
     * @returns mediaData
     */
    public async handleBilibiliMedia(originUrl: string, biliBiliSessData: string, biliBiliPlatform: string, biliBiliqn: number)
    {
        function getDurationByCid(pages: BVideoDetailDataPage[], cid: number)
        {
            const page = pages.find((page: { cid: number; }) => page.cid === cid);
            return page ? page.duration : 0;
        }
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const biliBiliApi = new BiliBiliApi();
        try
        {
            let bvid: string;

            if (originUrl.includes('http') && originUrl.includes('video'))
            {
                originUrl = originUrl.replace(/\?/g, '/');
                bvid = originUrl.split('/video/')[1].split('/')[0];
            } else if (originUrl.includes('BV') || originUrl.includes('bv'))
            {
                bvid = originUrl;
            } else
            {
                const mediaData = this.returnErrorMediaData(['暂不支持']);
                return mediaData;
            }
            const videoInfo = await biliBiliApi.getBilibiliVideoData(bvid, biliBiliSessData);
            if (!videoInfo)
            {
                const mediaData = this.returnErrorMediaData(['这个不是正确的bv号']);
                return mediaData;
            }
            const cid = videoInfo.pages[0].cid;
            const avid = videoInfo.aid;

            let videoStream = await biliBiliApi.getBilibiliVideoStream(avid.toString(), bvid, cid.toString(), biliBiliSessData, biliBiliPlatform, biliBiliqn);

            if (!videoStream)
            {
                const mediaData = this.returnErrorMediaData(['无法获取流媒体']);
                return mediaData;
            }
            while (await this.checkResponseStatus(videoStream.data.durl[0].url) === false)
            {
                biliBiliPlatform = 'html5';
                if (biliBiliPlatform === 'html5')
                {
                    biliBiliqn = this.changeBilibiliQn(biliBiliqn);
                }
                videoStream = await biliBiliApi.getBilibiliVideoStream(avid.toString(), bvid, cid.toString(), biliBiliSessData, biliBiliPlatform, biliBiliqn);
                if (!videoStream)
                {
                    const mediaData = this.returnErrorMediaData(['无法获取流媒体']);
                    return mediaData;
                }
                if (biliBiliqn === 6) break;
            }

            bitRate = this.getQuality(videoStream.data.quality);
            if (videoInfo.pages) duration = getDurationByCid(videoInfo.pages, cid);
            else duration = videoInfo.duration + 1;
            cover = videoInfo.pic;
            url = videoStream.data.durl[0].url;
            name = videoInfo.title;
            type = 'video';
            signer = videoInfo.owner.name;

            const mediaData = this.returnCompleteMediaData([type], [name], [signer], [cover], [url], [duration], [bitRate]);
            // console.log(videoStream)
            // console.log(videoInfo)
            return mediaData;


        } catch (error)
        {
            const mediaData = this.returnErrorMediaData([(error as Error).message]);
            return mediaData;
        }

    }

    /**
     * 更换bilibiliQn
     */
    private changeBilibiliQn(biliBiliqn: number)
    {
        switch (biliBiliqn)
        {
            case 127: // 8k
                biliBiliqn = 126;
                break;
            case 126: // 杜比视界
                biliBiliqn = 125;
                break;
            case 125: // HDR 真彩色
                biliBiliqn = 120;
                break;
            case 120: // 4k
                biliBiliqn = 116;
                break;
            case 116: // 1080p60帧
                biliBiliqn = 112;
                break;
            case 112: // 1080p高码率
                biliBiliqn = 80;
                break;
            case 80:
                biliBiliqn = 74;
                break;
            case 74: // 720p60帧
                biliBiliqn = 64;
                break;
            case 64:
                biliBiliqn = 16;
                break;
            case 16: // 未登录的默认值
                biliBiliqn = 6;
                break;
            case 6: //仅 MP4 格式支持, 仅platform=html5时有效
                break;
        }
        return biliBiliqn;
    }

    /**
     * 根据qn获取quality
     * @param qn bilibili qn 
     * @returns 
     */
    private getQuality(qn: number)
    {
        switch (qn)
        {
            case 127://8k
                return 8000;
            case 126://杜比视界
                return 1080; //不确定，乱填
            case 125://HDR 真彩色
                return 1080; //不确定，乱填
            case 120://4k
                return 4000;
            case 116://1080p60帧
                return 1080;
            case 112://1080p高码率
                return 1080;
            case 80:
                return 1080;
            case 74: //720p60帧
                return 720;
            case 64:
                return 720;
            case 16:// 未登录的默认值
                return 360;
            case 6://仅 MP4 格式支持, 仅platform=html5时有效
                return 240;
            default:
                return 720;
        }
    }
}