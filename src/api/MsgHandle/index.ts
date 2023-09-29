
import { Context, Logger } from 'koishi'
import { MediaParsing } from '../MediaParsing'
import { musicOrigin } from 'koishi-plugin-adapter-iirose'
import { Config } from '../Configuration Profile/configuration'
const comm:string = 'a'
export function apply(ctx: Context, config: Config) {
    ctx.command(comm, '链接').option('link', '只发出链接').action(
        async ({ options }, arg) => {
            if (arg != undefined){
                try {
                    const logger = new Logger('iirose-media-request')
                    const mediaData = await media(arg, config['timeOut'], config['waitTime'])
                    const music:musicOrigin = {
                        type: mediaData.type,
                        name: mediaData.name,
                        signer: "未知",
                        cover: "https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg",
                        link: mediaData.url,
                        url: mediaData.url,
                        duration: mediaData.duration,
                        bitRate: 720,
                        color: 'FFFFFF',
                    }
                    if(mediaData.error != undefined || mediaData.error != null ) {
                        logger.error(mediaData.error)
                        return mediaData.error
                    } 
                    if (music.url === undefined || music.url === null ) {
                        return `<>没有找到视频</>`
                    } else {
                        
                        if(options['link']){
                            return `${music.url}`
                        } else {
                            ctx.emit('iirose/makeMusic', music)
                            return `${music.url}`
                            
                        }
                    }
                } catch (error) {
                    return error
                }
            }
        }
    )

    

    
    
    
}

async function media(url:string, timeOut:number, waitTime:number){

    console.log(url)
    const regex = /^http/i;

    if (regex.test(url)) {
        console.log(`成功进入`)

        const mediaParsing = new MediaParsing(url, timeOut, waitTime)
        
        const mediaData = await mediaParsing.openBrowser();

        console.log('成功退出')
        
        return mediaData

    }
}