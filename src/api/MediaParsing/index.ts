import { ErrorHandle } from '../ErrorHandle';
import { GetMediaLength } from '../tools/getMediaLength';
import { ElementHandle, Page } from 'koishi-plugin-puppeteer';
import Jimp from 'jimp';
import * as os from 'os';
import axios from 'axios';
import { CheckMimeType } from '../tools/checkMimeType';
import { Context } from 'koishi';
import { BiliBiliApi } from '../BilibiliAPI';
import { NeteaseApi } from '../NeteaseAPI';

/**
 * 主要处理通用网站
 */
export class MediaParsing
{

    errorHandle = new ErrorHandle();

    /**
     * 返回完整的mediaData
     * @param type 类型
     * @param name 标题
     * @param signer 创作者
     * @param cover 封面图url
     * @param url 链接
     * @param duration 时长
     * @param bitRate 比特率
     * @return mediaData
     */
    public returnCompleteMediaData(
        type: 'music' | 'video',
        name: string,
        signer: string,
        cover: string,
        url: string,
        duration: number,
        bitRate: number

    )
    {
        const mediaData: MediaData = {
            type: type,
            name: name,
            signer: signer,
            cover: cover,
            link: url,
            url: url,
            duration: duration,
            bitRate: bitRate,
            error: null,
        };
        return mediaData;
    }

    /**
     * 返回包含错误信息的mediaData
     * @param errorMsg 错误信息
     * @return mediaData
     */
    public returnErrorMediaData(errorMsg: string)
    {
        const mediaData: MediaData = {
            type: 'music',
            name: '0',
            signer: '0',
            cover: '0',
            link: '0',
            url: '0',
            duration: 0,
            bitRate: 0,
            error: errorMsg,
        };
        return mediaData;
    }


    /**
     * 打开页面
     * @returns mediaData
     */
    public async openBrowser(ctx: Context, originUrl: string, timeOut: number, waitTime: number)
    {
        try
        {
            if (!await ctx.puppeteer)
            {
                const mediaData = this.returnErrorMediaData('puppeteer 未安装或没有正确配置，请在插件市场安装');
                return mediaData;
            }
            const page = await ctx.puppeteer.page();
            if (!page)
            {
                const mediaData = this.returnErrorMediaData('游览器没有正确打开，请检查日志');
                return mediaData;
            }
            const client = await page.target().createCDPSession();
            await client.send('Page.setDownloadBehavior', {
                behavior: 'deny',
                downloadPath: './',
            });

            const mediaData = await this.getMedia(page, originUrl, timeOut, waitTime);
            await page.close();
            return mediaData;
        } catch (error)
        {
            const mediaData = this.returnErrorMediaData(this.errorHandle.ErrorHandle((error as Error).message));
            return mediaData;
        }
    }

    /**
     * 检查看看链接是不是一个下载链接
     * @returns boolean
     */
    async isDownloadLink(originUrl: string): Promise<boolean>
    {
        try
        {
            const response = await axios.head(originUrl);
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition && contentDisposition.startsWith('attachment') || !response.headers['content-type'].includes('text/html'))
            {
                return true;
            } else
            {
                return false;
            }
        } catch (error)
        {
            return true;
        }
    }



    /**
     * 针对有重定向的链接，获取重定向后的链接
     * @param shortUrl 重定向前的链接
     * @returns 
     */
    public async getRedirectUrl(shortUrl: string)
    {
        try
        {
            const response = await axios.get(shortUrl, {
                maxRedirects: 0,
                responseType: 'stream' // 将 responseType 设置为 'stream'
            });
            return response.headers.location;
        } catch (error)
        {
            if (axios.isAxiosError(error) && error.response)
            {
                const redirectUrl = error.response.headers.location;
                return redirectUrl;
            } else
            {
                throw error; // 如果没有 response 对象，将错误重新抛出
            }
        }
    }


    /**
     * 尝试获取媒体的信息
     * @returns 
     */
    private async getMedia(page: Page, originUrl: string, timeOut: number, waitTime: number): Promise<MediaData>
    {
        const resourceUrls: string[] = [];
        let mediaType: 'music' | 'video' | null = null;
        let name: string;
        let signer: string;
        let cover: string | null = null;
        let url: string;
        let duration: number;
        let bitRate: number;
        try
        {
            page.on('request', async request =>
            {
                const url = await request.url();
                await new Promise(resolve => setTimeout(resolve, 1000)); // 为什么要等一秒？因为request.response()就是要等
                const response = await request.response();
                if (response)
                {
                    const checkMimeType = new CheckMimeType();
                    const mimeType = response.headers()['content-type'];
                    if (checkMimeType.isVideo(mimeType) && !url.includes('p-pc-weboff'))
                    {
                        processMedia('video', url, mimeType);
                    } else if (checkMimeType.isMusic(mimeType) && !url.includes('p-pc-weboff'))
                    {
                        processMedia('music', url, mimeType);
                    }
                } else if (url.includes('.m3u8') || url.includes('.m4a'))
                {
                    const mediaType = url.includes('.m4a') ? 'music' : 'video';
                    processMedia(mediaType, url, null);
                    // console.error(`No response for (is m3u8 or m4a): ${url}`);
                }
            });



            function processMedia(type: 'music' | 'video', url: string, mimeType: string | null)
            {
                console.log('>>', type, url, mimeType);
                resourceUrls.push(url);
                mediaType = type;
            }
            await page.goto(originUrl, { timeout: timeOut });
            await this.clickBtn(page);
            await page.waitForTimeout(waitTime);
            if (mediaType)
            {
                if (mediaType === 'video') cover = await this.getThumbNail(page) || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
                if (mediaType === 'music') cover = await this.searchImg(page) || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
            }

            name = await page.title() || '无法获取标题';
        } catch (error)
        {
            const mediaData = this.returnErrorMediaData(await this.errorHandle.ErrorHandle((error as Error).message));
            return mediaData;
        }
        console.log(`resourceUrls: ${resourceUrls.length}`);
        if (resourceUrls && resourceUrls.length > 0)
        {
            url = resourceUrls[0];
            signer = '无法获取';
            bitRate = 720;

            if (mediaType != null && cover)
            {
                const getMediaLength = new GetMediaLength();
                duration = await getMediaLength.mediaLengthInSec(url);
                const mediaData = this.returnCompleteMediaData(mediaType, name, signer, cover, url, duration, bitRate);
                return mediaData;
            } else
            {
                const mediaData = this.returnErrorMediaData('<>没有找到媒体，主要是无法获取type或者cover</>');
                return mediaData;
            }
        } else
        {
            const mediaData = this.returnErrorMediaData('<>没有找到媒体</>');
            return mediaData;
        }
    }

    /**
     * 获取缩略图
     * @returns 
     */
    private async getThumbNail(page: Page): Promise<string | null>
    {
        const path = os.homedir();
        const videoElement = await page.$('video');
        const iframeElement = await page.$('iframe');
        if (iframeElement)
        {
            // 在iframe中寻找video元素
            const frame = await iframeElement.contentFrame();
            const videoInsideIframe = frame ? await frame.$('body video') : null;
            if (videoInsideIframe) return this.resizeThumbNail(videoInsideIframe, `${path}/thumbnail.png`) || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
        }
        if (videoElement)
        {
            return this.resizeThumbNail(videoElement, `${path}/thumbnail.png`) || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
        }

        return 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
    }


    /**
     * 用截图转换成base64
     * @param element 
     * @param path 
     * @returns base64 image
     */
    private async resizeThumbNail(element: ElementHandle, path: string): Promise<string | null>
    {
        if (element)
        {
            await element.screenshot({ path });
            const image = await Jimp.read(path);
            image.resize(160, 100);
            const base64BlurredImage = `data:image/jpeg;base64,${(await image.getBufferAsync(Jimp.MIME_JPEG)).toString('base64')}`;
            return base64BlurredImage;
        }
        return null;
    }

    /**
     * 点击按钮，尽量找到播放按钮
     * @param elements elements
     */
    private async findClickableElement(elements: ElementHandle<Element>[])
    {
        for (const element of elements)
        {
            // 判断是否是 <a> 标签，如果是就跳过
            const tagName = await element.evaluate(node => node.tagName.toLowerCase());
            if (tagName === 'a')
            {
                continue;
            }

            const attributes = await element.evaluate((node: Element) =>
            {
                const attrs = [...node.attributes].map(attr => ({ name: attr.name, value: attr.value }));
                return { tagName: node.tagName.toLowerCase(), attrs, classList: [...node.classList] } as ElementAttributes;
            });

            if (attributes.attrs.some((attr: { value: string; }) => new RegExp('\\bplay\\b').test(attr.value)) || attributes.classList.includes('play'))
            {
                const isVisible = await element.evaluate((node: { getBoundingClientRect: () => DOMRect; }) =>
                {
                    const rect = node.getBoundingClientRect();
                    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                });

                if (isVisible)
                {
                    return element;
                }
            }
        }

        return null;
    }


    /**
     * 尝试寻找并点击play按钮
     */
    private async clickBtn(page: Page)
    {
        const frames = page.frames();
        let elementHandle = null;

        for (const frame of frames)
        {
            const elements = await frame.$$('body *');
            elementHandle = await this.findClickableElement(elements);
            if (elementHandle) break;
        }

        if (!elementHandle)
        {
            const elements = await page.$$('body *');
            elementHandle = await this.findClickableElement(elements);
        }

        if (elementHandle)
        {
            const elementInfo = await elementHandle.evaluate((node: Element) =>
            {
                const elem = node as HTMLElement;
                return {
                    tagName: elem.tagName,
                    attributes: [...elem.attributes].map(attr => ({ name: attr.name, value: attr.value })),
                    classList: [...elem.classList]
                };
            });

            console.log('Element TagName:', elementInfo.tagName);
            console.log('Element Attributes:', elementInfo.attributes);
            console.log('Element ClassList:', elementInfo.classList);

            try
            {
                await elementHandle.click();
            } catch (error)
            {
                console.error('Error clicking element:', error);
            }
        }
    }

    /**
     * 查找特定的图片，音乐网站会用到
     * @returns 
     */
    private async searchImg(page: Page)
    {
        const frames = page.frames();

        for (const frame of frames)
        {
            const imgsInFrame = await frame.$$('img');
            for (const img of imgsInFrame)
            {
                const dataSrc = await img.evaluate(element => element.getAttribute('data-src'));
                if (dataSrc) return dataSrc;
            }
        }

        const imgsInDocument = await page.$$('img');
        for (const img of imgsInDocument)
        {
            const dataSrc = await img.evaluate(element => element.getAttribute('data-src'));
            if (dataSrc) return dataSrc;
        }
    }
}

/**
 * 主要处理bilibili的网站
 */
export class BiliBili extends MediaParsing
{

    /**
     * 处理Bangumi的媒体
     * @returns mediaData
     */
    public async handleBilibiliBangumi(originUrl: string, biliBiliSessData: string, biliBiliqn: number)
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const biliBiliApi = new BiliBiliApi();
        const regex = /\/ep(\d+)/;
        const match = originUrl.match(regex);
        if (match)
        {
            const ep: number = parseInt(match[1], 10);
            const bangumiInfo = await biliBiliApi.getBangumiData(ep, biliBiliSessData);
            let bangumiStream = await biliBiliApi.getBangumiStream(ep, biliBiliSessData, biliBiliqn);
            if (!bangumiInfo && !bangumiStream)
            {
                const mediaData = this.returnErrorMediaData('获取番剧信息失败，可能接口已经改变');
                return mediaData;
            }
            while (await this.checkResponseStatus(bangumiStream.durl[0].url) === false)
            {
                biliBiliqn = this.changeBilibiliQn(biliBiliqn);
                bangumiStream = await biliBiliApi.getBangumiStream(ep, biliBiliSessData, biliBiliqn);
                if (biliBiliqn === 6) break;
            }
            const targetEpisodeInfo = bangumiInfo.episodes.find((episodes: { ep_id: number; }) => episodes.ep_id === ep);
            bitRate = this.getQuality(bangumiStream.quality);
            cover = targetEpisodeInfo.cover;
            duration = (targetEpisodeInfo.duration / 1000) + 1;
            url = bangumiStream.durl[0].url;
            name = targetEpisodeInfo.share_copy;
            type = 'video';
            signer = bangumiInfo.up_info.uname || '未定';

            const mediaData = this.returnCompleteMediaData(type, name, signer, cover, url, duration, bitRate);

            // console.log(bangumiInfo.episodes)
            // console.log(bangumiStream)
            return mediaData;


        }
        const mediaData = this.returnErrorMediaData('链接中没有发现ep号，请重新拿到链接');
        return mediaData;
    }

    /**
     * 处理bilibili的媒体
     * @returns mediaData
     */
    public async handleBilibiliMedia(originUrl: string, biliBiliSessData: string, biliBiliPlatform: string, biliBiliqn: number)
    {
        function getDurationByCid(pages: PageInfo[], cid: number)
        {
            const page = pages.find((page: { cid: number; }) => page.cid === cid);
            return page ? page.duration : 0;
        }
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const biliBiliApi = new BiliBiliApi();
        try
        {
            let bvid: string;
            if (originUrl.includes('http') && originUrl.includes('video'))
            {
                bvid = originUrl.split('/video/')[1].split('/')[0];
            } else if (originUrl.includes('BV') || originUrl.includes('bv'))
            {
                bvid = originUrl;
            } else
            {
                const mediaData = this.returnErrorMediaData('暂不支持');
                return mediaData;
            }
            const videoInfo = await biliBiliApi.getBilibiliVideoData(bvid, biliBiliSessData);
            if (!videoInfo)
            {
                const mediaData = this.returnErrorMediaData('这个不是正确的bv号');
                return mediaData;
            }
            const cid = videoInfo.pages[0].cid;
            const avid = videoInfo.aid;

            let videoStream = await biliBiliApi.getBilibiliVideoStream(avid, bvid, cid, biliBiliSessData, biliBiliPlatform, biliBiliqn);

            while (await this.checkResponseStatus(videoStream.durl[0].url) === false)
            {
                biliBiliPlatform = 'html5';
                if (biliBiliPlatform === 'html5')
                {
                    biliBiliqn = this.changeBilibiliQn(biliBiliqn);
                }
                videoStream = await biliBiliApi.getBilibiliVideoStream(avid, bvid, cid, biliBiliSessData, biliBiliPlatform, biliBiliqn);
                if (biliBiliqn === 6) break;
            }

            bitRate = this.getQuality(videoStream.quality);
            if (videoInfo.pages) duration = getDurationByCid(videoInfo.pages, cid);
            else duration = videoInfo.duration + 1;
            cover = videoInfo.pic;
            url = videoStream.durl[0].url;
            name = videoInfo.title;
            type = 'video';
            signer = videoInfo.owner.name;

            const mediaData = this.returnCompleteMediaData(type, name, signer, cover, url, duration, bitRate);
            // console.log(videoStream)
            // console.log(videoInfo)
            console.log(videoInfo.pages);
            return mediaData;
        } catch (error)
        {
            const mediaData = this.returnErrorMediaData((error as Error).message);
            return mediaData;
        }

    }

    /**
     * 更换bilibiliQn
     */
    private changeBilibiliQn(biliBiliqn: number)
    {
        switch (biliBiliqn)
        {
            case 127: // 8k
                biliBiliqn = 126;
                break;
            case 126: // 杜比视界
                biliBiliqn = 125;
                break;
            case 125: // HDR 真彩色
                biliBiliqn = 120;
                break;
            case 120: // 4k
                biliBiliqn = 116;
                break;
            case 116: // 1080p60帧
                biliBiliqn = 112;
                break;
            case 112: // 1080p高码率
                biliBiliqn = 80;
                break;
            case 80:
                biliBiliqn = 74;
                break;
            case 74: // 720p60帧
                biliBiliqn = 64;
                break;
            case 64:
                biliBiliqn = 16;
                break;
            case 16: // 未登录的默认值
                biliBiliqn = 6;
                break;
            case 6: //仅 MP4 格式支持, 仅platform=html5时有效
                break;
        }
        return biliBiliqn;
    }

    /**
     * 根据qn获取quality
     * @param qn bilibili qn 
     * @returns 
     */
    private getQuality(qn: number)
    {
        switch (qn)
        {
            case 127://8k
                return 8000;
            case 126://杜比视界
                return 1080; //不确定，乱填
            case 125://HDR 真彩色
                return 1080; //不确定，乱填
            case 120://4k
                return 4000;
            case 116://1080p60帧
                return 1080;
            case 112://1080p高码率
                return 1080;
            case 80:
                return 1080;
            case 74: //720p60帧
                return 720;
            case 64:
                return 720;
            case 16:// 未登录的默认值
                return 360;
            case 6://仅 MP4 格式支持, 仅platform=html5时有效
                return 240;
            default:
                return 720;
        }
    }

    /**
     * 检查看看一个url是否返回403，或者无法访问
     * @param url  链接
     * @returns boolean
     */
    private async checkResponseStatus(url: string)
    {
        try
        {
            const response = await axios.get(url, {
                headers: {
                    Referer: 'no-referrer',
                    Range: 'bytes=0-99999'
                }
            });
            if (response.status === 403 || response.status === 410)
            {
                return false;
            } else
            {
                return true;
            }
        } catch (error)
        {
            return false;
        }
    }
}

export class Netease extends MediaParsing
{
    /**
 * 处理bilibili的媒体
 * @returns mediaData
 */
    public async handleNeteaseMedia(originUrl: string)
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const neteaseApi = new NeteaseApi();
        try
        {
            let id: string | null;
            if (originUrl.includes('http') && originUrl.includes('song'))
            {
                const match1 = originUrl.match(/id=(\d+)/);
                const match2 = originUrl.match(/\/song\/(\d+)/);

                id = match1 ? match1[1] : (match2 ? match2[1] : null);
                if (id === null)
                {
                    const mediaData = this.returnErrorMediaData('暂不支持');
                    return mediaData;
                }
            }
            else
            {
                const mediaData = this.returnErrorMediaData('暂不支持');
                return mediaData;
            }
            let songData = await neteaseApi.getNeteaseMusicDetail(id);
            songData = songData.songs[0];
            let songResource = await neteaseApi.getSongResource(id);
            songResource = songResource[0];
            url = await neteaseApi.getRedirectUrl(songResource.url);
            type = 'music';
            name = songData.name;
            cover = songResource.pic;
            bitRate = songData.hMusic ? (songData.hMusic.bitrate / 1000) : 128; // 如果 songData.hMusic 存在则使用其比特率，否则使用默认值 128
            signer = songData.artists[0].name;
            duration = songData.duration / 1000;
            const mediaData = this.returnCompleteMediaData(type, name, signer, cover, url, duration, bitRate);
            return mediaData;
        } catch (error)
        {
            const mediaData = this.returnErrorMediaData((error as Error).message);
            return mediaData;
        }

    }
}