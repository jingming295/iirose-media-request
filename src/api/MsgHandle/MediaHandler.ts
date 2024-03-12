import { MediaParsing } from '../MediaParsing';
import { Netease } from '../MediaParsing/Netease';
import { BiliBili } from '../MediaParsing/BiliBili';
import { Context, Logger, Session } from 'koishi';
import { } from 'koishi-plugin-bilibili-login';
import { Config } from '../Configuration/configuration';
import { MediaData } from '../MediaParsing/interface';
import { Options, msgInfo } from './interface';
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
    async processMediaArgument(originMediaArgument: string, session: Session, config: Config, options: Options)
    {
        const mediaParsing = new MediaParsing();
        const bilibili = new BiliBili();
        const netease = new Netease();
        const timeOut = this.config['timeOut'];
        const waitTime = this.config['waitTime'];
        const maxCpuUsage = this.config['maxCpuUsage'];
        let conformPromise: Promise<MediaData[]> | null = null;
        const bilibiliVideo = this.ctx.BiliBiliVideo;
        const bilibiliLogin = this.ctx.BiliBiliLogin;
        const bilibiliAnime = this.ctx.BiliBiliMovie;
        ([{
            inc: ["bilibili", "BV"],
            fn: async () =>
            {
                const BilibiliAccountData = await bilibiliLogin.getBilibiliAccountData();
                
                if (!BilibiliAccountData)
                {
                    return mediaParsing.returnErrorMediaData([`sessdata为空，请填写bilibili-login插件的设置，或者清空数据库下的BilibiliAccount并且重启bilibili-login插件`]);
                }
                return await bilibili.handleBilibiliMedia(bilibiliVideo,originMediaArgument, BilibiliAccountData.SESSDATA, config);
            }
        }, {
            inc: ["BV"],
            fn: async () =>
            {
                const BilibiliAccountData = await bilibiliLogin.getBilibiliAccountData();
                if (!BilibiliAccountData)
                {
                    return mediaParsing.returnErrorMediaData([`sessdata为空，请填写bilibili-login插件的设置，或者清空数据库下的BilibiliAccount并且重启bilibili-login插件`]);
                }
                return await bilibili.handleBilibiliMedia(bilibiliVideo,originMediaArgument, BilibiliAccountData.SESSDATA, config);
            }
        }, {
            inc: ["bilibili", "bangumi"],
            fn: async () =>
            {
                const BilibiliAccountData = await bilibiliLogin.getBilibiliAccountData();
                if (!BilibiliAccountData)
                {
                    return mediaParsing.returnErrorMediaData([`sessdata为空，请填写bilibili-login插件的设置，或者清空数据库下的BilibiliAccount并且重启bilibili-login插件`]);
                }
                return await bilibili.handleBilibiliBangumi(bilibiliAnime,originMediaArgument, BilibiliAccountData.SESSDATA, config);
            }
        }, {
            inc: ["b23.tv"],
            fn: async () =>
            {
                const BilibiliAccountData = await bilibiliLogin.getBilibiliAccountData();
                if (!BilibiliAccountData)
                {
                    return mediaParsing.returnErrorMediaData([`sessdata为空，请填写bilibili-login插件的设置，或者清空数据库下的BilibiliAccount并且重启bilibili-login插件`]);
                }
                originMediaArgument = await mediaParsing.getRedirectUrl(originMediaArgument);
                originMediaArgument = originMediaArgument.replace(/\?/g, '/');
                return await bilibili.handleBilibiliMedia(bilibiliVideo,originMediaArgument, BilibiliAccountData.SESSDATA, config);
            }
        }, {
            inc: ["music.163.com", "song"],
            fn: async () =>
            {
                return await netease.handleNeteaseMedia(originMediaArgument);
            }
        }, {
            inc: ["music.163.com", "album"],
            fn: async () =>
            {
                return await netease.handleNeteaseAlbumAndSongList(originMediaArgument, session, config['mediaCardColor'], config['queueRequest'], options);
            }
        }, {
            inc: ["music.163.com", "playlist"],
            fn: async () =>
            {
                return await netease.handleNeteaseAlbumAndSongList(originMediaArgument, session, config['mediaCardColor'], config['queueRequest'], options);
            }
        }, {
            inc: ["163cn.tv"],
            fn: async () =>
            {
                originMediaArgument = await mediaParsing.getRedirectUrl(originMediaArgument);
                return await netease.handleNeteaseMedia(originMediaArgument);
            }
        }]).some(o =>
        {
            if (o.inc.every(k => originMediaArgument.includes(k)))
            {
                conformPromise = o.fn();
                return true;
            }
            else
                return false;
        });

        if (!conformPromise)
        {
            if (await mediaParsing.isDownloadLink(originMediaArgument)) return mediaParsing.returnErrorMediaData(['点播失败！']);
            return await mediaParsing.openBrowser(this.ctx, originMediaArgument, timeOut, waitTime, maxCpuUsage);
        }
        else
            return conformPromise;
    }



    /**
     * 处理MediaData， 决定返回的是respond Msg Info还是No Respond Msg Info
     * @param options 选项
     * @param arg 传入的字符串
     * @param userName 用户名
     * @returns string | null
     */
    public async handleMediaRequest(options: Options, arg: string, userName: string, uid: string, session: Session, config: Config)
    {
        if (arg === undefined) return this.returnNoRespondMsgInfo([null], [null]);
        try
        {
            const mediaArgument = this.parseMediaArgument(arg);
            if (!mediaArgument) return this.returnNoRespondMsgInfo([null], [null]); // mediaArgument为空

            const mediaData = await this.processMediaArgument(mediaArgument, session, config, options);
            const allErrors: string[] = [];
            let returnmsg: string[] = [];
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
            let conformPromise: Promise<msgInfo[]> | null = null;
            ([{
                opt: ["link"],
                fn: async () =>
                {
                    const urlInfo = mediaData.map(data => `<><parent><at name="${userName}"/><child/></parent>${data.url}</>`);
                    return this.returnHasRespondMsgInfo(urlInfo, Array.from({ length: urlInfo.length }, () => null));
                }
            }, {
                opt: ["data"],
                fn: async () =>
                {
                    const jsonData = mediaData.map(data => `<><parent><at name="${userName}"/><child/></parent>${JSON.stringify(data, null, 2)}</>`);
                    return this.returnHasRespondMsgInfo(jsonData, Array.from({ length: jsonData.length }, () => null));
                }
            }]).some(o =>
            {
                if (o.opt.every(k => options[k]))
                {
                    conformPromise = o.fn();
                    return true;
                }
                else
                    return false;
            });
            if(conformPromise){
                return conformPromise;
            }
            if (!conformPromise)
            {
                if (this.config.trackUser && mediaData.length === 1)
                {
                    const userActions = mediaData.map(data => `<><parent><at name="${userName}"/>点播了 ${data.name}<child/></parent></>`);
                    returnmsg = returnmsg.concat(userActions);

                    this.logger.info(`用户名：${userName} 唯一标识：${uid} 点播了 ${mediaData.map(data => `${data.name}: ${data.url}`).join(', ')}`);
                }

                if (returnmsg.length > 0)
                {
                    return this.returnHasRespondMsgInfo(returnmsg, mediaData);
                } else
                {
                    return this.returnHasRespondMsgInfo(Array.from({ length: mediaData.length }, () => null), mediaData);
                }
            }
            else {
                return this.returnHasRespondMsgInfo([null], [null]);
            }
        }
        catch (error)
        {
            this.logger.error(error);
            return this.returnHasRespondMsgInfo([(error as Error).message], [null]);
        }
    }
}