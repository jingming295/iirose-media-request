
import { Context } from 'koishi'
import { MediaParsing } from '../MediaParsing'
import { musicOrigin } from 'koishi-plugin-adapter-iirose'

export function apply(ctx: Context) {
    const comm:string = 'a'
    ctx.command(comm, '点歌或者点视频')
    ctx.on('message', async (session) => {
        const regex = /^\s*a\s*http/i;
        if (regex.test(session.content)) {
            console.log(`成功进入`)

            const url = session.content;
            const indexOfat = url.indexOf(comm);
            const originUrl = indexOfat !== -1 ? url.substring(indexOfat + 1) : url;

            const mediaParsing = new MediaParsing(originUrl)
            // const testmediaParsing = new TestingMediaParsing(originUrl);
            // console.log(await testmediaParsing.testopenBrowser());
            
            const mediaurl = await mediaParsing.openBrowser();

            console.log('成功退出')
            if (mediaurl === undefined) {
                session.send(`<>没有找到视频</>`);
            } else {
                const music:musicOrigin = {
                    type: 'video',
                    name: "测试",
                    signer: "暂定",
                    cover: "https://cloud.ming295.com/f/6YS1/1695478902.jpg",
                    link: mediaurl,
                    url: mediaurl,
                    duration: 4800,
                    bitRate: 720,
                    color: 'FFFFFF',
                }
                ctx.emit('iirose/makeMusic',music)
                session.send(`${mediaurl}`);
            }
        }
    })

    
    
    
}