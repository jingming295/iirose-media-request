import { Context, Extend, Logger, Session } from 'koishi';
import { UpdateChecker } from '../CheckForUpdate';
import { MediaHandler } from './MediaHandler';
import { Config } from '../Configuration/configuration';
// import { NeteaseApi } from '../NeteaseAPI';
/**
 * @description apply
 * @param ctx ctx
 * @param config config
 */
const logger = new Logger('iirose-media-request');

export async function apply(ctx: Context, config: Config)
{
    // const nNeteaseApi = new NeteaseApi();
    // const x = await nNeteaseApi.getNeteaseMusicDetail(2013290415);
    // console.log(x.songs[0]);
    function escapeSpecialCharacters(text: string | null): string | null
    {
        if (text === null)
        {
            return text;
        }
        return text
            .replace(/"/g, '&quot;')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    const handler = new MediaHandler(ctx, config);
    ctx.command('a', 'iirose艾特视频/音频')
        .option('link', '只发出链接')
        .option('data', '把整个music对象发出来')
        .option('cut', '如果是iirose平台就cut视频')
        .option('cutall', '如果是iirose平台就cut all视频')
        .action(
            async ({ session, options }, ...rest: string[]): Promise<void> =>
            {
                if (!session || !session.username || !options) return;

                const { username, uid, platform, event } = session;

                const isPrivateMsg = config['privateMsg'] === false && !event?.guild;

                if (isPrivateMsg && platform === 'iirose')
                {
                    session.send('私聊不支持此功能');
                    return;
                }

                if ((options['cut'] || options['cutall']) && platform === 'iirose')
                {
                    const action = options['cut'] ? 'cut' : 'cut all';
                    session.send(action);
                    if (config['trackUser'])
                    {
                        session.send(`<><parent><at id="${username}"/>${action}了视频<child/></parent></>`);
                    }
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
                        if (msg.length >= 1)
                        {
                            for (const info of msg)
                            {

                                if (info.messageContent) session.send(info.messageContent);
                                if (info.mediaData !== null && info.mediaData.error === null)
                                {
                                    const name = escapeSpecialCharacters(info.mediaData.name);
                                    const signer = escapeSpecialCharacters(info.mediaData.signer);
                                    const cover = escapeSpecialCharacters(info.mediaData.cover);
                                    const lyrics = escapeSpecialCharacters(info.mediaData.lyrics);
                                    const origin = escapeSpecialCharacters(info.mediaData.origin);
                                    
                                    if (info.mediaData.type === 'music')
                                    {
                                        session.send(`<audio name="${name}" url="${info.mediaData.url}" link="${info.mediaData.link}" author="${signer}" cover="${cover}" duration="${info.mediaData.duration}" bitRate="${info.mediaData.bitRate}" color="${config['mediaCardColor'] || 'FFFFFF'}" lyrics="${lyrics}" origin="${origin}"/>`);
                                    } else
                                    {
                                        session.send(`<video name="${name}" url="${info.mediaData.url}" link="${info.mediaData.link}" author="${signer}" cover="${cover}" duration="${info.mediaData.duration}" bitRate="${info.mediaData.bitRate}" color="${config['mediaCardColor'] || 'FFFFFF'}" origin="${origin}"/>`);
                                    }
                                    if(config['hotComment']  && info.mediaData.comment){
                                        const comment = escapeSpecialCharacters(info.mediaData.comment);
                                        session.send(`热评: ${comment}`);
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
                    logger.error(error);
                }
            }
        );
}