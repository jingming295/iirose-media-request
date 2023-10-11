import { Context, Logger } from 'koishi';
import { MediaParsing } from '../MediaParsing';
import { musicOrigin } from 'koishi-plugin-adapter-iirose';



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
     * @description 获取MediaData
     * @param url 链接
     * @returns mediaData || null
     */
    private async parseMedia(url: string)
    {

        const regex = /(http\S+)/i;
        const match = url.match(regex);
        const bvMatch = url.match(/(BV\w+)/i);
        if (match)
        {
            const extractedUrl = match[0];
            console.log(`成功进入`);
            const mediaParsing = new MediaParsing(
                extractedUrl,
                this.config['timeOut'],
                this.config['waitTime'],
                this.config['SESSDATA'],
                this.config['qn'],
                this.config['platform']
            );
            const mediaData = await mediaParsing.openBrowser(this.ctx);
            console.log('成功退出');
            return mediaData;
        }
        else if (bvMatch)
        {
            const extractedUrl = bvMatch[0];
            console.log(`成功进入`);
            const mediaParsing = new MediaParsing(
                extractedUrl,
                this.config['timeOut'],
                this.config['waitTime'],
                this.config['SESSDATA'],
                this.config['qn'],
                this.config['platform']
            );
            const mediaData = await mediaParsing.openBrowser(this.ctx);
            console.log('成功退出');
            return mediaData;
        }
        else
        {
            return null;
        }
    }


    /**
     * @description 处理MediaData到musicOrigin
     * @param options 选项
     * @param arg 传入的字符串
     * @param userName 用户名
     * @returns string | null
     */
    public async handleLink(options: { link?: boolean; data?: boolean; }, arg: string, userName: string)
    {
        if (arg != undefined)
        {
            try
            {
                const mediaData = await this.parseMedia(arg);
                if (mediaData === null) return null;
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
                    return mediaData.error;
                }
                else
                {
                    if (options['link'])
                    {
                        return `<><parent><at id="${userName}"/><child/></parent>${music.url}</>`;
                    }
                    else if (options['data'])
                    {
                        return `<><parent><at id="${userName}"/><child/></parent>${JSON.stringify(music, null, 2)}</>`;
                    }
                    else
                    {
                        let returnmsg: string | null = null;
                        // @ts-ignore
                        if (this.config['trackUser']) returnmsg = `<><parent><at id="${userName}"/>点播了 ${mediaData.name}<child/></parent></>`;
                        if (music.bitRate < 720) returnmsg += `<><parent>检测到视频的分辨率小于720p，可能是SESSDATA刷新啦，也可能是bilibili番剧不允许直接拿高画质<child/></parent></>`;

                        this.ctx.emit('iirose/makeMusic', music);
                        if (returnmsg) return returnmsg;
                        else return null;
                    }
                }
            }
            catch (error: any)
            {
                console.log(error);
            }
        }
        return null;
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
        .option('data', '把整个music对象发出来').action(
            async ({ session, options }, ...rest): Promise<any> =>
            {
                if (!session || !session.username || !options) return;
                if (session.platform !== 'iirose')
                    return `${session.platform}平台不支持此插件`;

                try
                {
                    let msgs: string[] = [];
                    if (rest)
                    {
                        for (const item of rest)
                        {

                            if (config['noHentai'])
                            {
                                if (
                                    item.includes('porn') ||
                                    item.includes('hanime') ||
                                    item.includes('xvideo') ||
                                    item.includes('dlsite') ||
                                    item.includes('hentai')
                                )
                                {
                                    return `禁止涩链接`;
                                }
                            }

                            const msg: string | null = await handler.handleLink(options, item, session.username);
                            if (msg) msgs.push(msg);
                        }
                    }
                    if (msgs)
                        return msgs[0];
                } catch (error)
                {
                    return error;
                }
            }
        );
}
