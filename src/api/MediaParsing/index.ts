import { ErrorHandle } from '../ErrorHandle';
import { GetMediaLength } from '../tools/getMediaLength';
import { ElementHandle, Page } from 'koishi-plugin-puppeteer';
import Jimp from 'jimp';
import * as os from 'os';
import axios from 'axios';
import { CheckMimeType } from '../tools/checkMimeType';
import { Context } from 'koishi';

declare global
{
    interface Window { __INITIAL_STATE__: any; }
}
/**
 * 主要处理获取媒体的各种信息
 */
export class MediaParsing
{
    timeOut: number;
    waitTime: number;
    biliBiliSessData: string;
    biliBiliqn: number;
    biliBiliPlatform: string;

    errorHandle = new ErrorHandle();
    originUrl: string;
    page!: Page;

    /**
     * 
     * @param url 链接
     * @param timeOut 超时时间
     * @param waitTime 等待时间
     * @param biliBiliSessData bilibili的SESSDATA
     * @param biliBiliqn qn画质
     * @param biliBiliPlatform 平台
     */
    constructor(url: string, timeOut: number, waitTime: number, biliBiliSessData: string, biliBiliqn: number, biliBiliPlatform: string)
    {
        this.originUrl = url;
        this.timeOut = timeOut;
        this.waitTime = waitTime;
        this.biliBiliSessData = biliBiliSessData;
        this.biliBiliqn = biliBiliqn;
        this.biliBiliPlatform = biliBiliPlatform;
    }

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
    async openBrowser(ctx: Context)
    {
        try
        {
            if(!await ctx.puppeteer){
                const mediaData = this.returnErrorMediaData('puppeteer 未安装或没有正确配置，请在插件市场安装');
                return mediaData;
            }
            this.page = await ctx.puppeteer.page();
            if (!this.page)
            {
                const mediaData = this.returnErrorMediaData('游览器没有正确打开，请检查日志');
                return mediaData;
            }
            const client = await this.page.target().createCDPSession();
            await client.send('Page.setDownloadBehavior', {
                behavior: 'deny',
                downloadPath: './',
            });
            const mediaData = await this.HandleUrl();
            await this.page.close();
            return mediaData;
        } catch (error: any)
        {
            console.log(error)
            const mediaData = this.returnErrorMediaData(this.errorHandle.ErrorHandle(error.message));
            return mediaData;
        }
    }


    private returnClassBilibili()
    {
        return new BiliBili(this.originUrl, this.timeOut, this.waitTime, this.biliBiliSessData, this.biliBiliqn, this.biliBiliPlatform);
    }

    /**
     * 主要处理url应该去哪里，url不一定是url，也可能是bv号
     * @returns mediaData
     */
    private async HandleUrl()
    {

        if (this.originUrl.includes('bilibili') && this.originUrl.includes('BV') || (this.originUrl.includes('BV') && !this.originUrl.includes('http')))
        {
            const bilibili = this.returnClassBilibili();
            const mediaData = await bilibili.handleBilibiliMedia();
            return mediaData;
        } else if ((this.originUrl.includes('bilibili') || this.originUrl.includes('b23.tv')) && this.originUrl.includes('bangumi'))
        {
            const bilibili = this.returnClassBilibili();
            return await bilibili.handleBilibiliBangumi();
        } else if (this.originUrl.includes('b23.tv'))
        {
            this.originUrl = await this.getRedirectUrl(this.originUrl);
            this.originUrl = this.originUrl.replace(/\?/g, '/');
            const bilibili = this.returnClassBilibili();
            const mediaData = await bilibili.handleBilibiliMedia();
            return mediaData;
        }
        else
        {
            if (await this.isDownloadLink())
            {
                const mediaData = this.returnErrorMediaData('这是个下载链接！');
                return mediaData;
            }
            const mediaData = await this.getMedia();
            return mediaData;
        }
    }

    /**
     * 检查看看链接是不是一个下载链接
     * @returns boolean
     */
    async isDownloadLink(): Promise<boolean>
    {
        const response = await axios.head(this.originUrl);
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition && contentDisposition.startsWith('attachment') || !response.headers['content-type'].includes('text/html')) return true;
        else return false;
    }


    /**
     * 针对有重定向的链接，获取重定向后的链接
     * @param shortUrl 重定向前的链接
     * @returns 
     */
    private async getRedirectUrl(shortUrl: string)
    {
        try
        {
            const response = await axios.get(shortUrl, { maxRedirects: 0 });
            return response.headers.location;
        } catch (error: any)
        {
            const response = error.response;
            const redirectUrl = response.headers.location;
            return redirectUrl;
        }
    }


    /**
     * 尝试获取媒体的信息
     * @returns 
     */
    private async getMedia(): Promise<MediaData>
    {
        const resourceUrls: string[] = [];
        let type: 'music' | 'video' | null = null;
        let name: string;
        let signer: string;
        let cover: string | null = null;
        let url: string;
        let duration: number;
        let bitRate: number;
        try
        {
            this.page.on('request', async request =>
            {
                const url = await request.url();
                await new Promise(resolve => setTimeout(resolve, 1000)); // 为什么要等一秒？因为request.response()就是要等
                const response = await request.response();
                if (url.includes('video.acfun.cn'))
                {
                    console.log(`url: ${url}\nresponse: ${response}`);
                }

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



            function processMedia(typee: 'music' | 'video', url: string, mimeType: string | null)
            {
                console.log('>>', typee, url, mimeType);
                resourceUrls.push(url);

                type = typee;
                resourceUrls[0];
            }
            await this.page.goto(this.originUrl, { timeout: this.timeOut });
            await this.clickBtn();
            await this.page.waitForTimeout(this.waitTime);
            if (type)
            {
                if (type === 'video') cover = await this.getThumbNail() || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
                if (type === 'music') cover = await this.searchImg() || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
            }

            name = await this.page.title() || '无法获取标题';
        } catch (error: any)
        {
            const mediaData = this.returnErrorMediaData(await this.errorHandle.ErrorHandle(error.message));
            return mediaData;
        }
        console.log(`resourceUrls: ${resourceUrls.length}`);
        if (resourceUrls && resourceUrls.length > 0)
        {
            url = resourceUrls[0];
            signer = '无法获取';
            bitRate = 720;

            if (type != null && cover)
            {
                const getMediaLength = new GetMediaLength();
                duration = await getMediaLength.mediaLengthInSec(url);
                const mediaData = this.returnCompleteMediaData(type, name, signer, cover, url, duration, bitRate);
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
    private async getThumbNail(): Promise<string | null>
    {
        const path = os.homedir();
        const videoElement = await this.page.$('video');
        const iframeElement = await this.page.$('iframe');
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
        for (let element of elements)
        {
            const attributes = await element.evaluate((node: { attributes: any; tagName: any; classList: any; }) =>
            {
                const attrs = [...node.attributes].map(attr => ({ name: attr.name, value: attr.value }));
                return { tagName: node.tagName, attrs, classList: [...node.classList] };
            });

            if (attributes.attrs.some((attr: { value: string; }) => new RegExp('\\bplay\\b').test(attr.value)) || attributes.classList.includes('play'))
            {
                const isVisible = await element.evaluate((node: { getBoundingClientRect: () => any; }) =>
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
    private async clickBtn()
    {
        const frames = this.page.frames();
        let elementHandle = null;

        for (let frame of frames)
        {
            const elements = await frame.$$('body *');
            elementHandle = await this.findClickableElement(elements);
            if (elementHandle) break;
        }

        if (!elementHandle)
        {
            const elements = await this.page.$$('body *');
            elementHandle = await this.findClickableElement(elements);
        }

        if (elementHandle)
        {
            const elementInfo = await elementHandle.evaluate((node: { tagName: any; attributes: any; classList: any; }) =>
            {
                // return {
                //     tagName: node.tagName,
                //     attributes: [...node.attributes].map(attr => ({ name: attr.name, value: attr.value })),
                //     classList: [...node.classList]
                // };
            });

            // console.log('Element TagName:', elementInfo.tagName);
            // console.log('Element Attributes:', elementInfo.attributes);
            // console.log('Element ClassList:', elementInfo.classList);

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
    private async searchImg()
    {
        const frames = this.page.frames();

        for (const frame of frames)
        {
            const imgsInFrame = await frame.$$('img');
            for (const img of imgsInFrame)
            {
                const dataSrc = await img.evaluate(element => element.getAttribute('data-src'));
                if (dataSrc) return dataSrc;
            }
        }

        const imgsInDocument = await this.page.$$('img');
        for (const img of imgsInDocument)
        {
            const dataSrc = await img.evaluate(element => element.getAttribute('data-src'));
            if (dataSrc) return dataSrc;
        }
    }
}

/**
 * 主要处理bilibili的媒体
 */
class BiliBili extends MediaParsing
{

    /**
     * 处理Bangumi的媒体
     * @returns mediaData
     */
    public async handleBilibiliBangumi()
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const regex = /\/ep(\d+)/;
        const match = this.originUrl.match(regex);
        if (match)
        {
            const ep: number = parseInt(match[1], 10);
            const bangumiInfo = await this.getBangumiData(ep);
            let bangumiStream = await this.getBangumiStream(ep);
            if (!bangumiInfo && !bangumiStream)
            {
                const mediaData = this.returnErrorMediaData('获取番剧信息失败，可能接口已经改变');
                return mediaData;
            }
            while (await this.checkResponseStatus(bangumiStream.durl[0].url) === false)
            {
                this.changeBilibiliQn();
                bangumiStream = await this.getBangumiStream(ep);
                if (this.biliBiliqn === 6) break;
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
     * 主要获取Bangumi的url
     * @param ep bilibili ep
     * @returns 
     */
    private async getBangumiStream(ep: number)
    {
        const url = 'https://api.bilibili.com/pgc/player/web/playurl';
        const params = {
            ep_id: ep,
            qn: this.biliBiliqn,
            fnval: 1,
            fourk: 1,
            high_quality: 1
        };

        const headers = await {
            Cookie: `SESSDATA=${this.biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                return response.data.result;
            } else
            {
                throw new Error(response.data.message);
            }
        } catch (error: any)
        {
            throw new Error(error.message);
        }
    }

    /**
     * 主要获取Bangumi的各种信息
     * @param ep bilibili ep
     * @returns 
     */
    private async getBangumiData(ep: number)
    {
        const url = 'https://api.bilibili.com/pgc/view/web/season';
        const params = {
            ep_id: ep
        };
        const headers = await {
            Cookie: `SESSDATA=${this.biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                return response.data.result;
            } else
            {
                return null;
            }
        } catch (error: any)
        {
            console.error('Error:', error.message);
        }

    }

    /**
     * 处理bilibili的媒体
     * @returns mediaData
     */
    public async handleBilibiliMedia()
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        try
        {
            let bvid: string;
            if (this.originUrl.includes('http') && this.originUrl.includes('video'))
            {
                bvid = this.originUrl.split('/video/')[1].split('/')[0];
            } else if (this.originUrl.includes('BV') || this.originUrl.includes('bv'))
            {
                bvid = this.originUrl;
            } else
            {
                const mediaData = this.returnErrorMediaData('暂不支持');
                return mediaData;
            }
            const videoInfo = await this.getBilibiliVideoData(bvid);
            if (!videoInfo)
            {
                const mediaData = this.returnErrorMediaData('这个不是正确的bv号');
                return mediaData;
            }
            const cid = videoInfo.pages[0].cid;
            const avid = videoInfo.aid;

            let videoStream = await this.getBilibiliVideoStream(avid, bvid, cid);

            while (await this.checkResponseStatus(videoStream.durl[0].url) === false)
            {
                this.biliBiliPlatform = 'html5';
                if (this.biliBiliPlatform === 'html5')
                {
                    this.changeBilibiliQn();
                }
                videoStream = await this.getBilibiliVideoStream(avid, bvid, cid);
                if (this.biliBiliqn === 6) break;
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

            return mediaData;

            function getDurationByCid(pages: any[], cid: any)
            {
                const page = pages.find((page: { cid: any; }) => page.cid === cid);
                return page ? page.duration : null;
            }
        } catch (error: any)
        {
            const mediaData = this.returnErrorMediaData(error.message);
            return mediaData;
        }

    }



    /**
    * 主要获取视频的各种信息
    * @param bvid bilibili bvid
    * @returns 
    */
    private async getBilibiliVideoData(bvid: string)
    {
        const url = 'https://api.bilibili.com/x/web-interface/view';
        const params = {
            bvid: bvid
        };
        const headers = await {
            Cookie: `SESSDATA=${this.biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                return response.data.data;
            } else
            {
                return null;
            }
        } catch (error: any)
        {
            console.error('Error:', error.message);
        }

    }

    /**
     * 主要获取视频的url
     * @param avid bilibili avid
     * @param bvid bilibili bvid
     * @param cid bilibili cid
     * @returns 
     */
    private async getBilibiliVideoStream(avid: string, bvid: string, cid: string)
    {
        const url = 'https://api.bilibili.com/x/player/wbi/playurl';
        const params = {
            bvid: bvid,
            avid: avid,
            cid: cid,
            qn: this.biliBiliqn,
            fnval: 1 | 128,
            fourk: 1,
            platform: this.biliBiliPlatform,
            high_quality: 1
        };
        const headers = await {
            Cookie: `SESSDATA=${this.biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                return response.data.data;
            } else
            {
                console.error('Error:', response.data.message);
            }
        } catch (error: any)
        {
            console.error('Error:', error.message);
        }
    }

    /**
     * 更换bilibiliQn
     */
    private changeBilibiliQn()
    {
        switch (this.biliBiliqn)
        {
            case 127: // 8k
                this.biliBiliqn = 126;
                break;
            case 126: // 杜比视界
                this.biliBiliqn = 125;
                break;
            case 125: // HDR 真彩色
                this.biliBiliqn = 120;
                break;
            case 120: // 4k
                this.biliBiliqn = 116;
                break;
            case 116: // 1080p60帧
                this.biliBiliqn = 112;
                break;
            case 112: // 1080p高码率
                this.biliBiliqn = 80;
                break;
            case 80:
                this.biliBiliqn = 74;
                break;
            case 74: // 720p60帧
                this.biliBiliqn = 64;
                break;
            case 64:
                this.biliBiliqn = 16;
                break;
            case 16: // 未登录的默认值
                this.biliBiliqn = 6;
                break;
            case 6: //仅 MP4 格式支持, 仅platform=html5时有效
                break;
        }
    }

    /**
     * 根据qn获取quality
     * @param qn bilibili qn 
     * @returns 
     */
    private getQuality(qn: any)
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
                    Range: 'bytes=0-1'
                }
            });
            if (response.status === 403 || response.status === 410)
            {
                return false;
            } else
            {
                return true;
            }
        } catch (error: any)
        {
            return false;
        }
    }
}