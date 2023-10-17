import { MediaParsing } from '../MediaParsing';
import { Netease } from '../MediaParsing/Netease';
import { BiliBili } from '../MediaParsing/BiliBili';
import { Context, Logger } from 'koishi';
/**
 * @description 处理媒体
 */
export class MediaHandler
{
    private logger: Logger;
    constructor(private ctx: Context, private config: Config)
    {
        this.logger = new Logger('iirose-media-request');

    }

    /**
     * 返回没有respond的msgInfo
     * @param msg 信息
     * @returns 
     */
    private returnNoRespondMsgInfo(msg: string | null, mediaData: MediaData | null)
    {
        const msgInfo: msgInfo = {
            hasRespond: false,
            messageContent: msg,
            mediaData: mediaData
        };
        return msgInfo;
    }

    /**
     * 返回respond的msgInfo
     * @param msg 信息
     * @returns 
     */
    private returnHasRespondMsgInfo(msg: string | null, mediaData: MediaData | null)
    {
        const msgInfo: msgInfo = {
            hasRespond: true,
            messageContent: msg,
            mediaData: mediaData
        };
        return msgInfo;
    }

    /**
     * 从argument提取出网址或者bv号
     * @param mediaArgument 网址或者bv号
     * @returns mediaData || null
     */
    private parseMediaArgument(arg: string)
    {
        const regex = /(http\S+)/i;
        const match = arg.match(regex);
        const bvMatch = arg.match(/(BV\w+)/i);
        let mediaArgument = '';
        if (match) mediaArgument = match[0];
        else if (bvMatch) mediaArgument = bvMatch[0];
        if (mediaArgument) return mediaArgument;
        else return null;
    }


    /**
     * 主要处理MediaArgument应该去哪里，MediaArgument 可以是链接，也可以是bv号
     * @param originMediaArgument 可以是链接，也可以是bv号
     * @returns mediaData
     */
    async processMediaArgument(originMediaArgument: string)
    {
        const mediaParsing = new MediaParsing();
        const bilibili = new BiliBili();
        const netease = new Netease();
        const sessData = this.config['SESSDATA'];
        const platform = this.config['platform'];
        const qn = this.config['qn'];
        const timeOut = this.config['timeOut'];
        const waitTime = this.config['waitTime'];
        const maxCpuUsage = this.config['maxCpuUsage'];

        switch (true)
        {
            case originMediaArgument.includes('bilibili') && originMediaArgument.includes('BV'):
            case (originMediaArgument.includes('BV') && !originMediaArgument.includes('http')):
                return await bilibili.handleBilibiliMedia(originMediaArgument, sessData, platform, qn);

            case (originMediaArgument.includes('bilibili') || originMediaArgument.includes('b23.tv')) &&
                originMediaArgument.includes('bangumi'):
                return await bilibili.handleBilibiliBangumi(originMediaArgument, sessData, qn);

            case originMediaArgument.includes('b23.tv'):
                originMediaArgument = await mediaParsing.getRedirectUrl(originMediaArgument);
                originMediaArgument = originMediaArgument.replace(/\?/g, '/');
                return await bilibili.handleBilibiliMedia(originMediaArgument, sessData, platform, qn);

            case originMediaArgument.includes('music.163.com'):
                return await netease.handleNeteaseMedia(originMediaArgument);

            case originMediaArgument.includes('163cn.tv'):
                originMediaArgument = await mediaParsing.getRedirectUrl(originMediaArgument);
                return await netease.handleNeteaseMedia(originMediaArgument);

            default:
                if (await mediaParsing.isDownloadLink(originMediaArgument))
                {
                    return mediaParsing.returnErrorMediaData('点播失败！');
                }
                return await mediaParsing.openBrowser(this.ctx, originMediaArgument, timeOut, waitTime, maxCpuUsage);
        }

    }



    /**
     * 处理MediaData， 决定返回的是respond Msg Info还是No Respond Msg Info
     * @param options 选项
     * @param arg 传入的字符串
     * @param userName 用户名
     * @returns string | null
     */
    public async handleMediaRequest(options: { link?: boolean; data?: boolean; param?: boolean; }, arg: string, userName: string, uid: string)
    {
        if (arg === undefined) return this.returnNoRespondMsgInfo(null, null);
        try
        {
            let returnmsg: string | null = null;
            const mediaArgument = this.parseMediaArgument(arg);
            if (!mediaArgument) return this.returnNoRespondMsgInfo(null, null); // mediaArgument为空

            let mediaData = await this.processMediaArgument(mediaArgument);
            mediaData = {
                type: mediaData.type,
                name: mediaData.name,
                signer: mediaData.signer || '无法获取',
                cover: mediaData.cover || 'data:image/jpeg;base64,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',
                link: mediaData.url,
                url: mediaData.url,
                duration: mediaData.duration,
                bitRate: mediaData.bitRate || 720,
                error: mediaData.error
            };
            if (mediaData.error)
            {
                this.logger.error(mediaData.error);
                return this.returnHasRespondMsgInfo(mediaData.error, mediaData);
            }
            switch (true)
            {
                case options['link']:
                    return this.returnHasRespondMsgInfo(`<><parent><at id="${userName}"/><child/></parent>${mediaData.url}</>`, null);
                case options['data']:
                    return this.returnHasRespondMsgInfo(`<><parent><at id="${userName}"/><child/></parent>${JSON.stringify(mediaData, null, 2)}</>`, null);
                case options['param']:
                    return this.returnHasRespondMsgInfo(`&lt;${mediaData.name} - ${mediaData.signer} - ${mediaData.cover}&gt; ${mediaData.url}`, null);
                default:
                    if (this.config['trackUser'])
                    {
                        returnmsg = `<><parent><at id="${userName}"/>点播了 ${mediaData.name}<child/></parent></>`;
                        this.logger.info(`用户名：${userName} 唯一标识：${uid} 点播了 ${mediaData.name}: ${mediaData.url}`);
                    }
                    if (mediaData.bitRate < 720 && mediaData.type === 'video') returnmsg = `<><parent>检测到视频的分辨率小于720p，可能是SESSDATA刷新啦，也可能是bilibili番剧不允许直接拿高画质<child/></parent></>`;
                    if (returnmsg) return this.returnHasRespondMsgInfo(returnmsg, mediaData);
                    else return this.returnHasRespondMsgInfo(null, mediaData);
            }

        }
        catch (error)
        {
            this.logger.error(error);
        }

        return this.returnNoRespondMsgInfo(null, null);
    }
}