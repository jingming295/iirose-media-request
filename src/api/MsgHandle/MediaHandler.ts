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
    private returnNoRespondMsgInfo(msg: (string | null)[], mediaData: (MediaData | null)[])
    {
        const msgInfoArray: msgInfo[] = [];

        for (let i = 0; i < msg.length; i++)
        {
            const msgInfoItem: msgInfo = {
                hasRespond: false,
                messageContent: msg[i],
                mediaData: mediaData[i]
            };

            msgInfoArray.push(msgInfoItem);
        }

        return msgInfoArray;
    }


    /**
     * 返回respond的msgInfo
     * @param msg 信息
     * @returns 
     */
    private returnHasRespondMsgInfo(msg: (string | null)[], mediaData: (MediaData | null)[])
    {
        const msgInfoArray: msgInfo[] = [];

        for (let i = 0; i < msg.length; i++)
        {
            const msgInfoItem: msgInfo = {
                hasRespond: true,
                messageContent: msg[i],
                mediaData: mediaData[i]
            };

            msgInfoArray.push(msgInfoItem);
        }

        return msgInfoArray;
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

            case (originMediaArgument.includes('music.163.com') && originMediaArgument.includes('song')):
                return await netease.handleNeteaseMedia(originMediaArgument);

            case (originMediaArgument.includes('music.163.com') && originMediaArgument.includes('album')):
                return await netease.handleNeteaseAlbum(originMediaArgument)
            case originMediaArgument.includes('163cn.tv'):
                originMediaArgument = await mediaParsing.getRedirectUrl(originMediaArgument);
                return await netease.handleNeteaseMedia(originMediaArgument);

            default:
                if (await mediaParsing.isDownloadLink(originMediaArgument))
                {
                    return mediaParsing.returnErrorMediaData(['点播失败！']);
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
        if (arg === undefined) return this.returnNoRespondMsgInfo([null], [null]);
        try
        {
            let returnmsg: string | null = null;
            const mediaArgument = this.parseMediaArgument(arg);
            if (!mediaArgument) return this.returnNoRespondMsgInfo([null], [null]); // mediaArgument为空

            let mediaData = await this.processMediaArgument(mediaArgument);
            let allErrors: string[] = [];
            for (const data of mediaData)
            {
                if (data.error)
                {
                    this.logger.error(data.error);
                    allErrors.push(data.error);
                }
            }
            if (allErrors.length > 0)
            {
                return this.returnHasRespondMsgInfo(allErrors, mediaData);
            }
            switch (true)
            {
                case options['link']:
                    const urlInfo = mediaData.map(data => `<><parent><at id="${userName}"/><child/></parent>${data.url}</>`);
                    return this.returnHasRespondMsgInfo(urlInfo, Array.from({ length: urlInfo.length }, () => null));

                case options['data']:
                    const jsonData = mediaData.map(data => `<><parent><at id="${userName}"/><child/></parent>${JSON.stringify(data, null, 2)}</>`);
                    return this.returnHasRespondMsgInfo(jsonData, Array.from({ length: jsonData.length }, () => null));

                case options['param']:
                    const paramInfo = mediaData.map(data => `&lt;${data.name} - ${data.signer} - ${data.cover}&gt; ${data.url}`);
                    return this.returnHasRespondMsgInfo(paramInfo, Array.from({ length: paramInfo.length }, () => null));

                default:
                    let returnmsg: string[] = [];

                    if (this.config['trackUser'])
                    {
                        const userActions = mediaData.map(data => `<><parent><at id="${userName}"/>点播了 ${data.name}<child/></parent></>`);
                        returnmsg = returnmsg.concat(userActions);

                        this.logger.info(`用户名：${userName} 唯一标识：${uid} 点播了 ${mediaData.map(data => `${data.name}: ${data.url}`).join(', ')}`);
                    }

                    if (mediaData.some(data => data.bitRate < 720 && data.type === 'video'))
                    {
                        const lowBitrateMsg = `<><parent>检测到视频的分辨率小于720p，可能是SESSDATA刷新啦，也可能是bilibili番剧不允许直接拿高画质<child/></parent>`;
                        returnmsg = returnmsg.map(msg => msg + lowBitrateMsg);
                    }

                    if (returnmsg.length > 0)
                    {
                        return this.returnHasRespondMsgInfo(returnmsg, mediaData);
                    } else
                    {
                        return this.returnHasRespondMsgInfo(Array.from({ length: mediaData.length }, () => null), mediaData);
                    }
            }


        }
        catch (error)
        {
            this.logger.error(error);
        }

        return this.returnNoRespondMsgInfo([null], [null]);
    }
}