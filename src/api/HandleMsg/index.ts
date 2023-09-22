
import { Context } from 'koishi'
import { MediaParsing } from '../MediaParsing'
import { } from 'koishi-plugin-adapter-iirose'

export function apply(ctx: Context) {
    ctx.on('message', async (session) => {
        const regex = /^\s*\.\s*http/i;

        if (regex.test(session.content)) {
            const url = session.content.substring(1);

            const mediaParsing = new MediaParsing()
            const mediaurl = await mediaParsing.getVideos(url);

            console.log(mediaurl)
            if (mediaurl.length === 0) {
                session.send(`<>该网址没有视频</>`);
            } else {
                session.send(`${mediaurl}`);
            }
        }
    })

    
    
    
}