import { Context, Logger } from 'koishi';
import { UpdateChecker } from '../CheckForUpdate';
import { MediaHandler } from './MediaHandler';
import { Config } from '../Configuration/configuration';
import { NeteaseApi } from '../NeteaseAPI';
/**
 * @description apply
 * @param ctx ctx
 * @param config config
 */
const logger = new Logger('iirose-media-request');
export async function apply(ctx: Context, config: Config)
{
    const comm: string = 'a';
    const handler = new MediaHandler(ctx, config);

    ctx.command(comm, 'iirose艾特视频/音频')
        .option('link', '只发出链接')
        .option('data', '把整个music对象发出来')
        .option('cut', '如果是iirose平台就cut视频')
        .option('cutall', '如果是iirose平台就cut all视频')
        .option('param', '返回类似<名词 – 作者 – 封面url> link 的东西，适用于iirose').action(
            async ({ session, options }, ...rest: string[]): Promise<void> =>
            {
                if (!session || !session.username || !options) return;
                const username = session.username;
                const uid = session.uid;
                if (options['cut'] && session.platform === 'iirose')
                {
                    session.send('cut');
                    if (config['trackUser']) session.send(`<><parent><at id="${username}"/>cut了视频<child/></parent></>`);
                } else if (options['cutall'] && session.platform === 'iirose')
                {
                    session.send('cut all');
                    if (config['trackUser']) session.send(`<><parent><at id="${username}"/>cut all了视频<child/></parent></>`);
                }
                try
                {
                    const forbiddenKeywords: string[] = ['porn', 'hanime', 'xvideo', 'dlsite', 'hentai'];

                    const responseArray: boolean[] = await Promise.all(rest.map(async item =>
                    {
                        if (config['noHentai'] && forbiddenKeywords.some(keyword => item.includes(keyword)))
                        {
                            session?.send("禁止涩链接");
                            return false;
                        }
                        const msg = await handler.handleMediaRequest(options, item, username, uid, session, config);
                        if (msg.length === 1)
                        {
                            for (const info of msg)
                            {
                                if (info.messageContent) session.send(info.messageContent);
                                if (info.mediaData !== null && info.mediaData.error === null)
                                {
                                    if (info.mediaData.type === 'music')
                                    {
                                        
                                        session.send(`<audio name="${info.mediaData.name}" url="${info.mediaData.url}" author="${info.mediaData.signer}" cover="${info.mediaData.cover}" duration="${info.mediaData.duration}" bitRate="${info.mediaData.bitRate}" color="${config['mediaCardColor'] || 'FFFFFF'}"/>`);
                                    } else
                                    {
                                        session.send(`<video name="${info.mediaData.name}" url="${info.mediaData.url}" author="${info.mediaData.signer}" cover="${info.mediaData.cover}" duration="${info.mediaData.duration}" bitRate="${info.mediaData.bitRate}" color="${config['mediaCardColor'] || 'FFFFFF'}"/>`);
                                    }
                                }
                            }
                            return msg[0].hasRespond;
                        }
                        for (const info of msg)
                        {
                            if (info.messageContent) session.send(info.messageContent);
                        }
                        return false;
                    }));

                    if (config['detectUpdate'] && responseArray.some(Boolean))
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
                    logger.error((error as Error).message);
                }
            }
        );
}
