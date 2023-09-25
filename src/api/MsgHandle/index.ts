
import { Context } from 'koishi'
import { MediaParsing } from '../MediaParsing'
import { musicOrigin } from 'koishi-plugin-adapter-iirose'
import { GetMediaLength } from '../tools/getMediaLength'

export function apply(ctx: Context) {
    const comm:string = 'a'
    ctx.command(comm, '点歌或者点视频')
    ctx.on('message', async (session) => {
        const regex = /^\s*a\s*http/i;
        if (regex.test(session.content)) {
            console.log(`成功进入`)
            const getMediaLength = new GetMediaLength()
            const url = session.content;
            const indexOfat = url.indexOf(comm);
            const originUrl = indexOfat !== -1 ? url.substring(indexOfat + 1) : url;

            const mediaParsing = new MediaParsing(originUrl)
            
            const mediaData = await mediaParsing.openBrowser();

            console.log('成功退出')
            if (mediaData.url === undefined) {
                if(mediaData.error!=null){
                    session.send(`错误：${mediaData.error}`);
                }
                session.send(`<>没有找到视频</>`);
            } else {
                const duration = await getMediaLength.mediaLengthInSec(mediaData.url)
                console.log(`duration: ${duration}`)

                const music:musicOrigin = {
                    type: mediaData.type,
                    name: mediaData.name,
                    signer: "未知",
                    cover: "https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg",
                    link: mediaData.url,
                    url: mediaData.url,
                    duration: duration,
                    bitRate: 720,
                    color: 'FFFFFF',
                }
                ctx.emit('iirose/makeMusic',music)
                session.send(`${mediaData.url}`);

                if(mediaData.error!=null){
                    session.send(`错误：${mediaData.error}`);
                }
            }
        }
    })

    
    
    
}