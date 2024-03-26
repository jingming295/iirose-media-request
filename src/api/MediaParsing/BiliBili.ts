import { MediaParsing } from ".";
import { Config } from "../Configuration/configuration";
import { CombinedQualityInfo } from "./interface";
import { BiliBiliVideo, MovieStreamFormat, BVideoStream, BiliBiliMovie, BiliBiliLive } from "koishi-plugin-bilibili-login";
/**
 * 主要处理bilibili的网站
 */
export class BiliBili extends MediaParsing
{
    /**
     * 处理Bangumi的媒体
     * @returns mediaData
     */
    public async handleBilibiliBangumi(BiliBiliMovie: BiliBiliMovie, originUrl: string, config: Config)
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        let link: string;
        const regex = /\/ep(\d+)/;
        const match = originUrl.match(regex);
        if (match)
        {
            let bangumiStream: MovieStreamFormat | null;
            const ep: number = parseInt(match[1], 10);
            const bangumiInfo = await BiliBiliMovie.getMovieDetailEPSS(ep);
            if (config.functionCompute)
            {
                bangumiStream = await BiliBiliMovie.getMovieStreamFromFunctionCompute(ep, 112, config.functionCompureAddress[0].url);
                if (!bangumiInfo || !bangumiStream)
                {
                    const mediaData = this.returnErrorMediaData(['获取番剧信息失败，可能接口已经改变']);
                    return mediaData;
                }
                if(!bangumiStream.result) return this.returnErrorMediaData([bangumiStream.message])
                const qn = bangumiStream.result.accept_quality;
                outerLoop: for (const item of qn)
                {
                    bangumiStream = await BiliBiliMovie.getMovieStreamFromFunctionCompute(ep, item, config.functionCompureAddress[0].url);
                    if (!bangumiStream) return this.returnErrorMediaData(['无法获取番剧流媒体']);
                    if(!bangumiStream.result) return this.returnErrorMediaData([bangumiStream.message])
                    if(!bangumiStream.result.durl) return this.returnErrorMediaData(['无法获取番剧流媒体'])
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
                bangumiStream = await BiliBiliMovie.getMovieStream(null, null, ep, null, 112, 1);
                if (!bangumiInfo || !bangumiStream)
                {
                    const mediaData = this.returnErrorMediaData(['获取番剧信息失败，可能接口已经改变']);
                    return mediaData;
                }
                if(!bangumiStream.result) return this.returnErrorMediaData([bangumiStream.message])
                const qn = bangumiStream.result.accept_quality;
                outerLoop: for (const item of qn)
                {
                    bangumiStream = await BiliBiliMovie.getMovieStream(null, null, ep, null, item, 1);
                    
                    if (!bangumiStream) return this.returnErrorMediaData(['无法获取番剧流媒体']);
                    if(!bangumiStream.result) return this.returnErrorMediaData([bangumiStream.message])
                    if(!bangumiStream.result.durl) return this.returnErrorMediaData(['无法获取番剧流媒体'])
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


            if (!bangumiStream || !bangumiStream.result.durl) return this.returnErrorMediaData(['无法获取番剧流媒体']);
            if(!bangumiInfo.result) return this.returnErrorMediaData(['无法获取番剧信息'])
            const targetEpisodeInfo = bangumiInfo.result.episodes.find((episodes: { ep_id: number; }) => episodes.ep_id === ep);
            if (targetEpisodeInfo)
            {
                bitRate = bangumiStream.result.quality;
                cover = targetEpisodeInfo.cover;
                duration = (targetEpisodeInfo.duration / 1000) + 1;
                url = bangumiStream.result.durl[0].url;
                name = targetEpisodeInfo.share_copy;
                type = 'video';
                signer = bangumiInfo.result.up_info.uname || '未定';
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
    public async handleBilibiliMedia(bilibiliVideo: BiliBiliVideo, originUrl: string, config: Config)
    {
        const GetVideoStream = async (h5videoStream: BVideoStream, pcvideoStream: BVideoStream, cid: number) =>
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
                    videoStream = await bilibiliVideo.getBilibiliVideoStream(avid, bvid, cid, item[1], item[0], 1);
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
        const videoInfo = await bilibiliVideo.getBilibiliVideoDetail(null, bvid);
        if (!videoInfo || !videoInfo.data)
        {
            const mediaData = this.returnErrorMediaData(['这个不是正确的bv号']);
            return mediaData;
        }
        videoInfo.data.pages.forEach((page) =>
        {
            if (!videoInfo.data) return;
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
                videoStream = await GetVideoStream(h5videoStream, pcvideoStream, cid);
                if (!videoStream || !videoStream.data || !videoStream.data.quality || !videoStream.data.durl) return this.returnErrorMediaData(['无法获取videoStream信息']);
                bitRate.push(videoStream.data.quality);
                url.push(videoStream.data.durl[0].url);
            }

        } else
        {
            const h5videoStream = await bilibiliVideo.getBilibiliVideoStream(avid, bvid, cids[0], 112, 'html5', 1);
            const pcvideoStream = await bilibiliVideo.getBilibiliVideoStream(avid, bvid, cids[0], 112, 'pc', 1);
            if (!h5videoStream || !pcvideoStream) return this.returnErrorMediaData(['无法获取B站视频流']);
            for (const cid of cids)
            {
                videoStream = await GetVideoStream(h5videoStream, pcvideoStream, cid);
                if (!videoStream || !videoStream.data || !videoStream.data.quality || !videoStream.data.durl) return this.returnErrorMediaData(['无法获取videoStream信息']);
                bitRate.push(videoStream.data.quality);
                url.push(videoStream.data.durl[0].url);
            }

        }

        const mediaData = this.returnCompleteMediaData(type, name, singer, cover, url, duration, bitRate, [], origin, link);
        return mediaData;
    }

    public async handleBilibiliLive(bilibiliLive: BiliBiliLive, originUrl:string, configDuration: number){
        function extractRoomIdFromUrl(url: string): string | null {
            const regex = /.*live\.bilibili\.com\/(\d+)\?.*/;
            const match = url.match(regex);
            
            if (match && match[1]) {
                return match[1];
            } else {
                return null;
            }
        }

        const duration: number[] = [];
        const cover: string[] = [];
        const name: string[] = [];
        const type: 'video'[] = [];
        const singer: string[] = [];
        const link: string[] = [];
        const origin: string[] = [];
        const bitRate: number[] = [];
        const url: string[] = [];

        const roomId = extractRoomIdFromUrl(originUrl);

        if(!roomId) return this.returnErrorMediaData(['无法获取直播房间号']);

        const liveDetail = await bilibiliLive.getLiveRoomDetail(parseInt(roomId))

        if(!liveDetail || !liveDetail.data) return this.returnErrorMediaData(['无法获取直播房间信息']);

        const liveUserData = await bilibiliLive.getLiveUserDetail(liveDetail.data.uid)

        if(!liveUserData || !liveUserData.data) return this.returnErrorMediaData(['无法获取直播用户信息']);

        const actualID = liveDetail.data.room_id

        const liveStream = await bilibiliLive.getLiveStream(actualID, 'web', null, 30000)
        
        if(!liveStream || !liveStream.data || !liveStream.data.durl) return this.returnErrorMediaData(['无法获取直播流媒体']);

        duration[0] = configDuration
        cover[0] = liveDetail.data.user_cover
        name[0] = liveDetail.data.title
        type[0] = 'video'
        singer[0] = liveUserData.data.info.uname
        link[0] = `https://live.bilibili.com/${actualID}`
        origin[0] = 'bilibililive'
        bitRate[0] = liveStream.data.current_qn
        url[0] = liveStream.data.durl[0].url
        
        return this.returnCompleteMediaData(type, name, singer, cover, url, duration, bitRate, [], origin, link);
    }
}