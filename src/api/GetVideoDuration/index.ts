import { Context } from 'koishi';
/**
 * 随便填的
 */
interface Player {
    (tag: string): string;
}
/**
 * videojs是由https://vjs.zencdn.net/7.14.3/video.js提供
 */
declare var videojs: Player;
/**
 * @description 获取媒体长度
 */
export class GetMediaLength
{
    /**
     * 不用你说，我也知道这个方法很抽象
     * 我不想用ffmpeg
     * 获取媒体长度（秒）
     * @param mediaurl 媒体链接
     * @param ctx ctx
     */
    async mediaLengthInSec(mediaurl: string, ctx: Context): Promise<number>
    {
        try
        {
            const page = await ctx.puppeteer.page();
            await page.addScriptTag({ url: 'https://vjs.zencdn.net/7.14.3/video.js' });
            

            const duration:number = await page.evaluate((mediaurl) =>
            {
                return new Promise((resolve, reject) => {
                    // 创建 video 元素
                    const video = document.createElement('video');
                    video.id = 'my-video';
                    video.classList.add('video-js');
                    video.controls = true;
                    video.preload = 'auto';
                    video.width = 640;
                    video.height = 360;
                    // 创建 source 元素
                    const source = document.createElement('source');
                    source.src = mediaurl; // 使用传入的mediaurl
                    // 将 source 添加到 video 中
                    video.appendChild(source);
                    // 将 video 添加到 body 中
                    document.body.appendChild(video);
                    videojs('my-video');
                    // 监听 loadedmetadata 事件
                    video.addEventListener('loadedmetadata', function() {
                        resolve(video.duration);
                    });
            
                    // 设置超时时间
                    setTimeout(() => {
                        reject(1);
                    }, 5000);  // 等待5秒
                });
            }, mediaurl) as number;
            
            await page.close();
            return duration;
        } catch (error)
        {
            console.log(error);
            return 1;
        }
    }
}
