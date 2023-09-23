
import { Context } from 'koishi'
import { MediaParsing } from '../MediaParsing'
import { } from 'koishi-plugin-adapter-iirose'

export function apply(ctx: Context) {
    ctx.on('message', async (session) => {
        const regex = /^\s*\.\s*http/i;

        if (regex.test(session.content)) {
            console.log(`成功进入`)

            const url = session.content;
            const indexOfDot = url.indexOf('.');
            const originUrl = indexOfDot !== -1 ? url.substring(indexOfDot + 1) : url;

            const mediaParsing = new MediaParsing(originUrl)
            // const testmediaParsing = new TestingMediaParsing(originUrl);
            // console.log(await testmediaParsing.testopenBrowser());
            
            const mediaurl = await mediaParsing.openBrowser();

            console.log('成功退出')
            if (mediaurl === undefined) {
                session.send(`<>没有闻到味儿</>`);
            } else {
                session.send(`${mediaurl}`);
            }
        }
    })

    
    
    
}