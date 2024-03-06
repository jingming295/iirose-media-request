import { MediaParsing } from ".";
import { BiliBiliApi } from "../BilibiliAPI";
import { Config } from "../Configuration/configuration";
import { CombinedQualityInfo } from "./interface";
import { bilibiliVideo, bangumiStream, BVideoStream } from "koishi-plugin-bilibili-login";
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
        let link: string;
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
                bitRate = bangumiStream.result.quality;
                cover = targetEpisodeInfo.cover;
                duration = (targetEpisodeInfo.duration / 1000) + 1;
                url = bangumiStream.result.durl[0].url;
                name = targetEpisodeInfo.share_copy;
                type = 'video';
                signer = bangumiInfo.up_info.uname || '未定';
                link = `https://www.bilibili.com/bangumi/play/ep${ep}`;

                const mediaData = this.returnCompleteMediaData([type], [name], [signer], [cover], [url], [duration], [bitRate], [], ['bilibili'], [link]);

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
    public async handleBilibiliMedia(bilibiliVideo: bilibiliVideo, originUrl: string, biliBiliSessData: string, config: Config)
    {
        function getDurationByCid(pages: BVideoDetailDataPage[], cid: number)
        {
            const page = pages.find((page: { cid: number; }) => page.cid === cid);
            return page ? page.duration : 0;
        }
        function delay(ms: number)
        {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        const GetVideoStream = async (h5videoStream: BVideoStream, pcvideoStream: BVideoStream, cid: string) =>
        {
            if (
                !h5videoStream.data ||
                !pcvideoStream.data ||
                !h5videoStream.data.accept_quality ||
                !pcvideoStream.data.accept_quality ||
                !h5videoStream.data.accept_format ||
                !pcvideoStream.data.accept_format
            ) throw new Error('无法获取清晰度信息, 可能被风控了！请稍后尝试！');

            const h5Quality = h5videoStream.data.accept_quality;
            const pcQuality = pcvideoStream.data.accept_quality;
            const CombinedQualityInfo: CombinedQualityInfo[] = h5Quality
                .filter((item, index) => !(h5videoStream.data?.accept_format?.includes('flv') && h5videoStream.data.accept_format.split(',')[index].includes('flv')))
                .map(item => ['html5', item] as CombinedQualityInfo)
                .concat(
                    pcQuality
                        .filter((item, index) => !(pcvideoStream.data?.accept_format?.includes('flv') && pcvideoStream.data.accept_format.split(',')[index].includes('flv')))
                        .map(item => ['pc', item] as CombinedQualityInfo)
                );

            CombinedQualityInfo.sort((a, b) =>
            {
                if (b[1] === a[1])
                {
                    // 如果两者数字相等
                    if (a[0] === 'html5')
                    {
                        // html5排在前面
                        return -1;
                    } else if (b[0] === 'html5')
                    {
                        // pc排在前面
                        return 1;
                    } else
                    {
                        // 如果都是相同类型，则按照原顺序
                        return 0;
                    }
                } else
                {
                    // 按照数字大小降序排列
                    return b[1] - a[1];
                }
            });
            outerLoop: for (const [index, item] of CombinedQualityInfo.entries())
            {
                if (config.functionCompute)
                {
                    videoStream = await bilibiliVideo.getBilibiliVideoStreamFromFunctionCompute(avid.toString(), bvid, cid.toString(), item[0], item[1], config.functionCompureAddress[0].url);
                } else
                {
                    videoStream = await bilibiliVideo.getBilibiliVideoStream(avid, bvid, cid.toString(), item[0], item[1]);
                }
                if (!videoStream || !videoStream.data || !videoStream.data.durl)
                {
                    continue;
                }
                if (await this.checkResponseStatus(videoStream.data.durl[0].url) === true)
                {
                    break outerLoop;
                }
                const isLastItem = index === CombinedQualityInfo.length - 1;
                if (isLastItem)
                {
                    throw new Error('在尝试了全部清晰度和平台后，无法获取流媒体');
                }
            }
            return videoStream;
        };

        const duration: number[] = [];
        const cids: number[] = [];
        const cover: string[] = [];
        const name: string[] = [];
        const type: 'video'[] = [];
        const singer: string[] = [];
        const link: string[] = [];
        const origin: string[] = [];
        const bitRate: number[] = [];
        const url: string[] = [];

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
        const videoInfo = await bilibiliVideo.getBilibiliVideoDetail(bvid);
        if (!videoInfo || !videoInfo.data)
        {
            const mediaData = this.returnErrorMediaData(['这个不是正确的bv号']);
            return mediaData;
        }
        videoInfo.data.pages.forEach((page) =>
        {
            if(!videoInfo.data) return;
            cids.push(page.cid);
            cover.push(videoInfo.data.pic);
            type.push('video');
            singer.push(videoInfo.data.owner.name);
            link.push(`https://www.bilibili.com/video/${bvid}`);
            duration.push(page.duration + 1 || videoInfo.data.duration + 1);
            origin.push('bilibili');
            if (videoInfo.data.pages.length <= 1)
            {
                name.push(videoInfo.data.title);
            } else
            {
                name.push(`${videoInfo.data.title} - P${page.part}`);
            }
        });
        const avid = videoInfo.data.aid;
        let videoStream: BVideoStream | null;

        if (config.functionCompute)
        {
            for (const cid of cids)
            {
                const h5videoStream = await bilibiliVideo.getBilibiliVideoStreamFromFunctionCompute(avid.toString(), bvid, cid.toString(), 'html5', 112, config.functionCompureAddress[0].url);
                const pcvideoStream = await bilibiliVideo.getBilibiliVideoStreamFromFunctionCompute(avid.toString(), bvid, cid.toString(), 'pc', 112, config.functionCompureAddress[0].url);
                if (!h5videoStream || !pcvideoStream) return this.returnErrorMediaData(['无法获取B站视频流']);
                videoStream = await GetVideoStream(h5videoStream, pcvideoStream, cid.toString());
                if (!videoStream || !videoStream.data || !videoStream.data.quality || !videoStream.data.durl) return this.returnErrorMediaData(['无法获取videoStream信息']);
                bitRate.push(videoStream.data.quality);
                url.push(videoStream.data.durl[0].url);
            }

        } else
        {
            const h5videoStream = await bilibiliVideo.getBilibiliVideoStream(avid, bvid, cids[0].toString(), 'html5', 112);
            const pcvideoStream = await bilibiliVideo.getBilibiliVideoStream(avid, bvid, cids[0].toString(), 'pc', 112);
            if(!h5videoStream || !pcvideoStream) return this.returnErrorMediaData(['无法获取B站视频流']);
            for (const cid of cids)
            {
                videoStream = await GetVideoStream(h5videoStream, pcvideoStream, cid.toString());
                if (!videoStream|| !videoStream.data || !videoStream.data.quality || !videoStream.data.durl) return this.returnErrorMediaData(['无法获取videoStream信息']);
                bitRate.push(videoStream.data.quality);
                url.push(videoStream.data.durl[0].url);
            }

        }

        const mediaData = this.returnCompleteMediaData(type, name, singer, cover, url, duration, bitRate, [], origin, link);
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