import { Context, Logger } from 'koishi';
import { MediaParsing } from '../MediaParsing';
import { musicOrigin } from 'koishi-plugin-adapter-iirose';
import { Config } from '../Configuration Profile/configuration';

/**
 * 获取并处理MediaData
 */
class MediaHandler
{
    private logger: Logger;
    constructor(private ctx: Context, private config: Config)
    {
        this.logger = new Logger('iirose-media-request');
    }

    /**
     * 获取MediaData
     * @param url 
     * @returns 
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
                this.config['platform'],
                this.ctx
            );
            const mediaData = await mediaParsing.openBrowser();
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
                this.config['platform'],
                this.ctx
            );
            const mediaData = await mediaParsing.openBrowser();
            console.log('成功退出');
            return mediaData;
        }
        else
        {
            return null;
        }
    }


    /**
     * 处理MediaData到musicOrigin
     * @param options 
     * @param arg 
     * @returns 
     */
    public async handleLink(options: { link?: boolean; }, arg: string, userName: string)
    {
        if (arg != undefined)
        {
            try
            {
                const mediaData = await this.parseMedia(arg);
                if (mediaData === null)
                    return null;
                const music: musicOrigin = {
                    type: mediaData.type,
                    name: mediaData.name,
                    signer: mediaData.signer || '无法获取',
                    cover: mediaData.cover || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg',
                    link: mediaData.url,
                    url: mediaData.url,
                    duration: mediaData.duration,
                    bitRate: mediaData.bitRate || 720,
                    color: this.config['mediaCardColor'],
                };
                if (mediaData.error)
                {
                    this.logger.error(mediaData.error);
                    return mediaData.error;
                }

                if (!music.url)
                {
                    return `<>没有找到媒体</>`;
                }
                else
                {
                    if (options['link'])
                    {
                        return `${music.url}`;
                    }
                    else if (options['data'])
                    {
                        return `${JSON.stringify(music, null, 2)}`;
                    }
                    else
                    {
                        this.ctx.emit('iirose/makeMusic', music);
                        if (music.bitRate < 720)
                            return `检测到视频的分辨率小于720p，是不是SESSDATA刷新啦`;
                    }
                }
            }
            catch (error)
            {
                return error;
            }
        }
    }
}

export function apply(ctx: Context, config: Config)
{
    const comm: string = 'a';
    const handler = new MediaHandler(ctx, config);
    ctx.command(comm, 'iirose艾特视频/音频')
        .option('link', '只发出链接')
        .option('data', '把整个music对象发出来').action(
            async ({ session, options }, ...rest) =>
            {
                if (session.platform !== 'iirose')
                    return `${session.platform}平台不支持此插件`;
                try
                {
                    let msgs: string[] = [];
                    if (rest)
                    {
                        for (const item of rest)
                        {
                            const msg: string = await handler.handleLink(options, item, session.username);
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
