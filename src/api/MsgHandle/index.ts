import { Context, Logger, Session } from 'koishi';
import { UpdateChecker } from '../CheckForUpdate';
import { MediaHandler } from './MediaHandler';

/**
 * @description apply
 * @param ctx ctx
 * @param config config
 */
export function apply(ctx: Context, config: Config)
{
    const comm: string = 'a';
    const handler = new MediaHandler(ctx, config);
    ctx.command(comm, 'iirose艾特视频/音频')
        .option('link', '只发出链接')
        .option('data', '把整个music对象发出来')
        .option('cut', '如果是iirose平台就cut视频')
        .option('param', '返回类似<名词 – 作者 – 封面url> link 的东西，适用于iirose').action(
            async ({ session, options }, ...rest: string[]): Promise<void> =>
            {
                if (!session || !session.username || !options) return;

                const username = session.username;
                const uid = session.uid;

                handleCutOption(session, options, config, username);
                await handleMediaRequests(handler, options, rest, username, uid, session, config);
            }
        );
}

/**
 * 处理媒体请求的函数
 * @param handler 媒体处理器对象
 * @param options 选项对象
 * @param rest 剩余参数（媒体链接）
 * @param username 用户名
 * @param uid 用户ID
 * @param session 会话对象
 * @param config 配置对象
 */
async function handleMediaRequests(handler: MediaHandler, options: Record<string, boolean>, rest: string[], username: string, uid: string, session: Session, config: Config): Promise<void>
{
    const logger = new Logger('iirose-media-request');
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
            const msg = await handler.handleMediaRequest(options, item, username, uid);
            if (msg.messageContent)
            {
                session.send(msg.messageContent);
            }
            if (msg.mediaData !== null && msg.mediaData.error === null)
            {
                sendMediaMessage(session, msg, config);
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
    } catch (error)
    {
        logger.error(error);
    }
}

/**
 * 处理'cut'选项的函数
 * @param session 会话对象
 * @param options 选项对象
 * @param config 配置对象
 * @param username 用户名
 */
function handleCutOption(session: Session, options: Record<string, boolean>, config: Config, username: string)
{
    if (options['cut'] && session.platform === 'iirose')
    {
        session.send('cut');
        if (config['trackUser']) session.send(`<><parent><at id="${username}"/>cut了视频<child/></parent></>`);
    }
}

/**
 * 发送媒体消息的函数
 * @param session 会话对象
 * @param msg 消息信息对象
 * @param config 配置对象
 */
function sendMediaMessage(session: Session, msg: msgInfo, config: Config)
{
    if (msg.mediaData !== null)
    {
        const { name, url, signer, cover, duration, bitRate } = msg.mediaData;
        const color = config['mediaCardColor'] || 'FFFFFF';

        if (msg.mediaData.type === 'music')
        {
            session.send(`<audio name="${name}" url="${url}" author="${signer}" cover="${cover}" duration="${duration}" bitRate="${bitRate}" color="${color}"/>`);
        } else
        {
            session.send(`<video name="${name}" url="${url}" author="${signer}" cover="${cover}" duration="${duration}" bitRate="${bitRate}" color="${color}"/>`);
        }
    }
}

