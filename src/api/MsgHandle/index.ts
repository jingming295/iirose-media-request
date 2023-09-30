import { Context, Logger } from 'koishi'
import { MediaParsing } from '../MediaParsing'
import { musicOrigin } from 'koishi-plugin-adapter-iirose'
import { Config } from '../Configuration Profile/configuration'

/**
 * 获取并处理MediaData
 */
class MediaHandler {
    private logger: Logger
    constructor(private ctx: Context, private config: Config) {
        this.logger = new Logger('iirose-media-request')
    }

    /**
     * 获取MediaData
     * @param url 
     * @returns 
     */
    private async parseMedia(url: string) {
        const regex = /^http/i;
        if (regex.test(url)) {
            console.log(`成功进入`)
            const mediaParsing = new MediaParsing(url, this.config['timeOut'], this.config['waitTime'])
            const mediaData = await mediaParsing.openBrowser();
            console.log('成功退出')
            return mediaData
        } else {
            return null
        }
    }

    

    /**
     * 处理MediaData到musicOrigin
     * @param options 
     * @param arg 
     * @returns 
     */
    public async handleLink(options: { link?: boolean }, arg: string) {
        if (arg != undefined) {
            try {
                const mediaData = await this.parseMedia(arg)
                if (mediaData === null) return null
                const music: musicOrigin = {
                    type: mediaData.type,
                    name: mediaData.name,
                    signer: "未知",
                    cover: mediaData.cover,
                    link: mediaData.url,
                    url: mediaData.url,
                    duration: mediaData.duration,
                    bitRate: 720,
                    color: 'FFFFFF',
                }
                if (mediaData.error != undefined || mediaData.error != null) {
                    this.logger.error(mediaData.error)
                    return mediaData.error
                }
                if (!music.url) {
                    return `<>没有找到视频</>`
                } else {
                    if (options['link']) {
                        return `${music.url}`
                    } else {
                        this.ctx.emit('iirose/makeMusic', music)
                        return `${music.url}`
                    }
                }
            } catch (error) {
                return error
            }
        }
    }
}

export function apply(ctx: Context, config: Config) {
    const comm: string = 'a'
    const handler = new MediaHandler(ctx, config)
    ctx.command(comm, '链接').option('link', '只发出链接').action(
        async ({ options }, arg) => {
            const msg = handler.handleLink(options, arg)
            if(msg)return msg
        }
    )

    ctx.command('cut', '切当前媒体').action(
        async ({ options }, arg) => {
            return 'cut'
        }
    )
}
