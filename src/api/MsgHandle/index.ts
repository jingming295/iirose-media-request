
import { Context } from 'koishi'
import { MediaParsing } from '../MediaParsing'
import { musicOrigin } from 'koishi-plugin-adapter-iirose'
const comm:string = 'a'
export function apply(ctx: Context) {
    ctx.command(comm, '链接').option('link', '只发出链接').action(
        async ({ options }, arg) => {
            if (arg != undefined){
                try {
                    const mediaData = await media(arg, ctx)
                    if (mediaData.url === undefined || mediaData.url === null ) {
                        return `<>没有找到视频</>`
                    } else {
                        
                        if(options['link']){
                            return `${mediaData.url}`
                        } else {
                            ctx.emit('iirose/makeMusic', mediaData)
                            return `${mediaData.url}`
                            
                        }
                    }
                } catch (error) {
                    return error
                }
            }
        }
    )

    

    
    
    
}

async function media(url:string, ctx: Context){

    console.log(url)
    const regex = /^http/i;

    if (regex.test(url)) {
        console.log(`成功进入`)

        const mediaParsing = new MediaParsing(url)
        
        const mediaData = await mediaParsing.openBrowser();

        console.log('成功退出')
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
        return music

    }
}