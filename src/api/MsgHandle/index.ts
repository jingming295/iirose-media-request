import { Context, Logger } from 'koishi';
import { musicOrigin } from 'koishi-plugin-adapter-iirose';
import { UpdateChecker } from '../CheckForUpdate';
import { MediaParsing, BiliBili, Netease } from '../MediaParsing';

interface msgInfo
{
    hasRespond: boolean;
    messageContent: string | null;
}

/**
 * @description 处理媒体
 */
class MediaHandler
{
    private logger: Logger;
    constructor(private ctx: Context, private config: any)
    {
        this.logger = new Logger('iirose-media-request');

    }

    /**
     * 返回没有respond的msgInfo
     * @param msg 信息
     * @returns 
     */
    private returnNoRespondMsgInfo(msg: string | null)
    {
        const msgInfo: msgInfo = {
            hasRespond: false,
            messageContent: msg
        };
        return msgInfo;
    }

    /**
     * 返回respond的msgInfo
     * @param msg 信息
     * @returns 
     */
    private returnHasRespondMsgInfo(msg: string | null)
    {
        const msgInfo: msgInfo = {
            hasRespond: true,
            messageContent: msg
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
                    return mediaParsing.returnErrorMediaData('这是个下载链接！');
                }
                return await mediaParsing.openBrowser(this.ctx, originMediaArgument, timeOut, waitTime);
        }

    }



    /**
     * 处理MediaData， 决定返回的是respond Msg Info还是No Respond Msg Info
     * @param options 选项
     * @param arg 传入的字符串
     * @param userName 用户名
     * @returns string | null
     */
    public async handleMediaRequest(options: { link?: boolean; data?: boolean; param?: boolean; }, arg: string, userName: string, uid: any)
    {
        if (arg === undefined) return this.returnNoRespondMsgInfo(null);
        try
        {
            const mediaArgument = this.parseMediaArgument(arg);
            if (!mediaArgument) return this.returnNoRespondMsgInfo(null); // mediaArgument为空

            const mediaData = await this.processMediaArgument(mediaArgument);
            const music: musicOrigin = {
                type: mediaData.type,
                name: mediaData.name,
                signer: mediaData.signer || '无法获取',
                cover: mediaData.cover || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg',
                link: mediaData.url,
                url: mediaData.url,
                duration: mediaData.duration,
                bitRate: mediaData.bitRate || 720,
                color: this.config['mediaCardColor'] || 'FFFFFF',
            };
            if (mediaData.error)
            {
                this.logger.error(mediaData.error);
                return this.returnHasRespondMsgInfo(mediaData.error);
            }
            switch (true)
            {
                case options['link']:
                    return this.returnHasRespondMsgInfo(`<><parent><at id="${userName}"/><child/></parent>${music.url}</>`);
                case options['data']:
                    return this.returnHasRespondMsgInfo(`<><parent><at id="${userName}"/><child/></parent>${JSON.stringify(music, null, 2)}</>`);
                case options['param']:
                    return this.returnHasRespondMsgInfo(`&lt;${music.name} - ${music.signer} - ${music.cover}&gt; ${music.url}`);
                default:
                    let returnmsg: string | null = null;
                    // @ts-ignore
                    if (this.config['trackUser'])
                    {
                        returnmsg = `<><parent><at id="${userName}"/>点播了 ${mediaData.name}<child/></parent></>`;
                        this.logger.info(`用户名：${userName} 唯一标识：${uid} 点播了 ${mediaData.name}: ${mediaData.url}`);
                    }
                    if (music.bitRate < 720 && music.type === 'video') returnmsg = `<><parent>检测到视频的分辨率小于720p，可能是SESSDATA刷新啦，也可能是bilibili番剧不允许直接拿高画质<child/></parent></>`;
                    this.ctx.emit('iirose/makeMusic', music);
                    if (returnmsg) return this.returnHasRespondMsgInfo(returnmsg);
                    else return this.returnHasRespondMsgInfo(null);
            }

        }
        catch (error: any)
        {
            this.logger.error(error);
        }

        return this.returnNoRespondMsgInfo(null);
    }
}

/**
 * @description apply
 * @param ctx ctx
 * @param config config
 */
export function apply(ctx: Context, config: any)
{
    const comm: string = 'a';
    const handler = new MediaHandler(ctx, config);

    ctx.command(comm, 'iirose艾特视频/音频')
        .option('link', '只发出链接')
        .option('data', '把整个music对象发出来')
        .option('cut', '如果是iirose平台就cut视频')
        .option('param', '返回类似<名词 – 作者 – 封面url> link 的东西，适用于iirose').action(
            async ({ session, options }, ...rest): Promise<any> =>
            {
                if (!session || !session.username || !options) return;
                const username = session.username;
                const uid = session.uid;
                if (options['cut'] && session.platform === 'iirose')
                {
                    session.send('cut');
                    if (config['trackUser']) session.send(`<><parent><at id="${username}"/>cut了视频<child/></parent></>`);
                }

                if (session.platform !== 'iirose') return `${session.platform}平台不支持此插件`;

                try
                {
                    const forbiddenKeywords = ['porn', 'hanime', 'xvideo', 'dlsite', 'hentai'];

                    const responseArray = await Promise.all(rest.map(async item =>
                    {
                        if (config['noHentai'] && forbiddenKeywords.some(keyword => item.includes(keyword)))
                        {
                            session?.send("禁止涩链接")
                            return false;
                        }
                        const msg = await handler.handleMediaRequest(options, item, username, uid);
                        if(msg.messageContent){
                            session.send(msg.messageContent)
                        }
                        return msg.hasRespond;
                    }));

                    if (responseArray.some(Boolean))
                    {
                        const updateChecker = new UpdateChecker();
                        const updateInfo = await updateChecker.checkForUpdates();
                        if (!updateInfo.latest)
                        {
                            session.send(updateInfo.messageContent);
                        }
                    }

                    return;
                } catch (error)
                {
                    return error;
                }
            }
        );
}


