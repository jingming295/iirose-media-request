import { Context } from 'koishi';
import { ParseMediaMetaData } from '../ParseMediaMetaData';
import fetch from 'node-fetch'
/**
 * 随便填的
 */
interface Player
{
    (tag: string): string;
}
/**
 * videojs是由https://vjs.zencdn.net/7.14.3/video.js 提供
 */
declare const videojs: Player;
/**
 * @description 获取媒体长度
 */
export class GetMediaLength
{
    /**
     * 获取视频的时长
     * @param url 链接
     * @param mimeType mimeType
     * @param ctx ctx
     * @return number
     */
    async GetMediaLength(url: string, mimeType: string | null, ctx: Context)
    {
        if (url && ctx)
            if (
                mimeType !== 'video/mp4' &&
                mimeType !== 'application/vnd.apple.mpegURL' &&
                mimeType !== 'application/vnd.apple.mpegurl' &&
                mimeType !== 'audio/mpeg'
            ) return await this.mediaLengthInSec(url, ctx);

        return await this.GetMediaLengthByReadMetaData(url, mimeType);
    }
    /**
     * 不用你说，我也知道这个方法很抽象
     * 我不想用ffmpeg
     * 获取媒体长度（秒）
     * @param mediaurl 媒体链接
     * @param ctx ctx
     */
    private async mediaLengthInSec(mediaurl: string, ctx: Context): Promise<number>
    {
        const page = await ctx.puppeteer.page();
        await page.addScriptTag({ url: 'https://vjs.zencdn.net/7.14.3/video.js' });


        const duration: number = await page.evaluate((mediaurl) =>
        {
            return new Promise((resolve, reject) =>
            {
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
                video.addEventListener('loadedmetadata', function ()
                {
                    resolve(video.duration);
                });

                // 设置超时时间
                setTimeout(() =>
                {
                    reject(1);
                }, 5000);  // 等待5秒
            });
        }, mediaurl) as number;

        await page.close();
        return duration;
    }

    /**
     * 读取METADATA来获得时长
     * @param url 
     * @param mimeType 
     * @param ctx 
     * @returns 
     */
    async GetMediaLengthByReadMetaData(url: string | null, mimeType: string | null)
    {
        const parseMediaMetaData = new ParseMediaMetaData();
        // 测试用
        if (!url) url = '';
        // 测试用
        if (!mimeType) mimeType = 'video/webm';
        const response = await fetch(url, {
            headers: {
                Range: 'bytes=0-50000'
            }
        });
        if (!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.arrayBuffer();

        const buffer = Buffer.from(data);

        const uint8Array = new Uint8Array(buffer);

        if (mimeType === 'video/mp4') return parseMediaMetaData.parseMP4Duration(uint8Array) / 1000;
        else if (
            mimeType === 'application/vnd.apple.mpegURL' ||
            mimeType === 'application/vnd.apple.mpegurl'
        ) return await parseMediaMetaData.parseM3U8(uint8Array, url);
        else if (mimeType === 'audio/mpeg')
        {
            // m4a 居然能用mp4的方法
            return parseMediaMetaData.parseMP4Duration(uint8Array) / 1000;
        }
        else throw new Error(`GetMediaLengthByReadMetaData: 没找到时长`);
    }




}