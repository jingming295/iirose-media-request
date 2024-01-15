import { Logger } from "koishi";
import { MediaParsing } from ".";
import { BiliBiliApi } from "../BilibiliAPI";
import { Config } from "../Configuration/configuration";




/**
 * 主要处理bilibili的网站
 */
export class BiliBili extends MediaParsing
{

    /**
     * 处理Bangumi的媒体
     * @returns mediaData
     */
    public async handleBilibiliBangumi(originUrl: string, biliBiliSessData: string, config: Config)
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
            let bangumiStream: bangumiStream;
            const ep: number = parseInt(match[1], 10);
            const bangumiInfo = await biliBiliApi.getBangumiData(ep, biliBiliSessData);
            if (config.functionCompute)
            {
                bangumiStream = await biliBiliApi.getBangumiStreamFromFunctionCompute(ep, biliBiliSessData, 112, config.functionCompureAddress[0].url);
                if (!bangumiInfo || !bangumiStream)
                {
                    const mediaData = this.returnErrorMediaData(['获取番剧信息失败，可能接口已经改变']);
                    return mediaData;
                }
                const qn = bangumiStream.result.accept_quality;
                outerLoop: for (const item of qn)
                {
                    bangumiStream = await biliBiliApi.getBangumiStreamFromFunctionCompute(ep, biliBiliSessData, item, config.functionCompureAddress[0].url);
                    if (await this.checkResponseStatus(bangumiStream.result.durl[0].url) === true)
                    {
                        break outerLoop;
                    }
                    const lastItem = qn[qn.length - 1];
                    if (item === lastItem)
                    {
                        const mediaData = this.returnErrorMediaData(['在尝试了全部清晰度和平台后，无法获取流媒体']);
                        return mediaData;
                    }
                }
            } else
            {
                bangumiStream = await biliBiliApi.getBangumiStream(ep, biliBiliSessData, 112);
                if (!bangumiInfo || !bangumiStream)
                {
                    const mediaData = this.returnErrorMediaData(['获取番剧信息失败，可能接口已经改变']);
                    return mediaData;
                }
                const qn = bangumiStream.result.accept_quality;
                outerLoop: for (const item of qn)
                {
                    bangumiStream = await biliBiliApi.getBangumiStream(ep, biliBiliSessData, item);
                    if (await this.checkResponseStatus(bangumiStream.result.durl[0].url) === true)
                    {
                        break outerLoop;
                    }
                    const lastItem = qn[qn.length - 1];
                    if (item === lastItem)
                    {
                        const mediaData = this.returnErrorMediaData(['在尝试了全部清晰度和平台后，无法获取流媒体']);
                        return mediaData;
                    }
                }
            }



            const targetEpisodeInfo = bangumiInfo.episodes.find((episodes: { ep_id: number; }) => episodes.ep_id === ep);
            if (targetEpisodeInfo)
            {
                bitRate = this.getQuality(bangumiStream.result.quality);
                cover = targetEpisodeInfo.cover;
                duration = (targetEpisodeInfo.duration / 1000) + 1;
                url = bangumiStream.result.durl[0].url;
                name = targetEpisodeInfo.share_copy;
                type = 'video';
                signer = bangumiInfo.up_info.uname || '未定';

                const mediaData = this.returnCompleteMediaData([type], [name], [signer], [cover], [url], [duration], [bitRate]);

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
    public async handleBilibiliMedia(originUrl: string, biliBiliSessData: string, config: Config)
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
        let videoStream: BVideoStream;

        if (config.functionCompute)
        {
            let h5videoStream = await biliBiliApi.getBilibiliVideoStreamFromFunctionCompute(avid.toString(), bvid, cid.toString(), biliBiliSessData, 'html5', 112, config.functionCompureAddress[0].url);
            let pcvideoStream = await biliBiliApi.getBilibiliVideoStreamFromFunctionCompute(avid.toString(), bvid, cid.toString(), biliBiliSessData, 'pc', 112, config.functionCompureAddress[0].url);

            videoStream = h5videoStream;

            const h5Quality = h5videoStream.data.accept_quality;
            const pcQuality = pcvideoStream.data.accept_quality;

            const CombinedQualityInfo = h5Quality
                .filter((item, index) => !(h5videoStream.data.accept_format.includes('flv') && h5videoStream.data.accept_format.split(',')[index].includes('flv')))
                .map(item => ['html5', item] as CombinedQualityInfo)
                .concat(
                    pcQuality
                        .filter((item, index) => !(pcvideoStream.data.accept_format.includes('flv') && pcvideoStream.data.accept_format.split(',')[index].includes('flv')))
                        .map(item => ['pc', item] as CombinedQualityInfo)
                );

            CombinedQualityInfo.sort((a, b) =>
            {
                if (b[1] === a[1])
                {
                    return a[0] === 'pc' ? -1 : 1;
                }
                return b[1] - a[1];
            });

            outerLoop: for (const [index, item] of CombinedQualityInfo.entries())
            {
                videoStream = await biliBiliApi.getBilibiliVideoStreamFromFunctionCompute(avid.toString(), bvid, cid.toString(), biliBiliSessData, item[0], item[1], config.functionCompureAddress[0].url);
                if (await this.checkResponseStatus(videoStream.data.durl[0].url) === true)
                {
                    break outerLoop;
                }
                const isLastItem = index === CombinedQualityInfo.length - 1;
                if (isLastItem)
                {
                    const mediaData = this.returnErrorMediaData(['在尝试了全部清晰度和平台后，无法获取流媒体']);
                    return mediaData;
                }
            }
        } else
        {
            let h5videoStream = await biliBiliApi.getBilibiliVideoStream(avid.toString(), bvid, cid.toString(), biliBiliSessData, 'html5', 112);
            let pcvideoStream = await biliBiliApi.getBilibiliVideoStream(avid.toString(), bvid, cid.toString(), biliBiliSessData, 'pc', 112);

            videoStream = h5videoStream;

            const h5Quality = h5videoStream.data.accept_quality;
            const pcQuality = pcvideoStream.data.accept_quality;

            const CombinedQualityInfo = h5Quality
                .filter((item, index) => !(h5videoStream.data.accept_format.includes('flv') && h5videoStream.data.accept_format.split(',')[index].includes('flv')))
                .map(item => ['html5', item] as CombinedQualityInfo)
                .concat(
                    pcQuality
                        .filter((item, index) => !(pcvideoStream.data.accept_format.includes('flv') && pcvideoStream.data.accept_format.split(',')[index].includes('flv')))
                        .map(item => ['pc', item] as CombinedQualityInfo)
                );

            CombinedQualityInfo.sort((a, b) =>
            {
                if (b[1] === a[1])
                {
                    return a[0] === 'pc' ? -1 : 1;
                }
                return b[1] - a[1];
            });

            outerLoop: for (const [index, item] of CombinedQualityInfo.entries())
            {
                videoStream = await biliBiliApi.getBilibiliVideoStream(avid.toString(), bvid, cid.toString(), biliBiliSessData, item[0], item[1]);
                if (await this.checkResponseStatus(videoStream.data.durl[0].url) === true)
                {
                    break outerLoop;
                }
                const isLastItem = index === CombinedQualityInfo.length - 1;
                if (isLastItem)
                {
                    const mediaData = this.returnErrorMediaData(['在尝试了全部清晰度和平台后，无法获取流媒体']);
                    return mediaData;
                }
            }
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