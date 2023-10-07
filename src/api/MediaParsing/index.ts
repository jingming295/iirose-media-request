// import { Browser, BrowserContext, ElementHandle, Page, firefox } from 'playwright';
import { CheckMimeType } from '../tools/checkMimeType';
import { ErrorHandle } from '../ErrorHandle';
import { DownloadBrowser } from '../Browser/index';
import { GetMediaLength } from '../tools/getMediaLength';
import { ElementHandle, Page } from 'koishi-plugin-puppeteer'
import Jimp from 'jimp';
import * as os from 'os';
import axios from 'axios';
import { Context } from 'koishi';

declare global
{
    interface Window { __INITIAL_STATE__: any; }
}
export class MediaParsing
{
    timeOut: number;
    waitTime: number;
    biliBiliSessData: string;
    biliBiliqn: number;
    biliBiliPlatform: string;
    mediaData: MediaData = {
        type: null,
        name: null,
        signer: null,
        cover: null,
        link: null,
        url: null,
        duration: null,
        bitRate: null,
        color: null,
        error: null
    };
    errorHandle = new ErrorHandle();
    originUrl: string;
    // browser: Browser;
    // context: BrowserContext;
    page:Page;
    ctx: Context


    constructor(url: string, timeOut: number, waitTime: number, biliBiliSessData: string, biliBiliqn: number, biliBiliPlatform: string, ctx:Context)
    {
        this.originUrl = url;
        this.timeOut = timeOut;
        this.waitTime = waitTime;
        this.biliBiliSessData = biliBiliSessData;
        this.biliBiliqn = biliBiliqn;
        this.biliBiliPlatform = biliBiliPlatform;
        this.ctx = ctx
    }


    /**
     * 只需要开一个browser就好了
     * @returns 
     */
    async openBrowser()
    {

        let mediaData = this.mediaData;
        try
        {
            this.page = await this.ctx.puppeteer.page()
            mediaData = await this.HandleUrl();
            await this.page.close();
            return mediaData;
        } catch (error)
        {
            mediaData.error = await this.errorHandle.ErrorHandle(error.message);

            return mediaData;
        }


    }

    /**
     * 返回mediaData对象
     * @returns mediaData
     */
    private returnMediaData()
    {
        const mediaData: MediaData = {
            type: null,
            name: null,
            signer: null,
            cover: null,
            link: null,
            url: null,
            duration: null,
            bitRate: null,
            color: null,
            error: null
        };
        return mediaData;
    }

    /**
     * @description 主要处理url应该去哪里
     * @returns 
     */
    private async HandleUrl()
    {
        if (this.originUrl.includes('bilibili') && this.originUrl.includes('BV') || (this.originUrl.includes('BV') && !this.originUrl.includes('http')))
        {
            const MediaData = await this.handleBilibiliMedia();
            return MediaData;
        } else if ((this.originUrl.includes('bilibili') || this.originUrl.includes('b23.tv')) && this.originUrl.includes('ep'))
        {
            return await this.handleBilibiliBangumi();
        } else if (this.originUrl.includes('b23.tv'))
        {
            this.originUrl = await this.getRedirectUrl(this.originUrl);
            this.originUrl = this.originUrl.replace(/\?/g, '/');
            const MediaData = await this.handleBilibiliMedia();
            return MediaData;
        }
        else
        {
            const getMediaLength = new GetMediaLength;
            const MediaData = await this.getMedia();
            if (MediaData.url && !MediaData.duration)
            {
                MediaData.duration = await getMediaLength.mediaLengthInSec(MediaData.url);
            }
            return MediaData;
        }

    }


    /**
     * 针对有重定向的链接，获取重定向后的链接
     * @param shortUrl 
     * @returns 
     */
    private async getRedirectUrl(shortUrl: string)
    {
        try
        {
            const response = await axios.get(shortUrl, { maxRedirects: 0 });
            return response.headers.location;
        } catch (error)
        {
            const response = error.response;
            const redirectUrl = response.headers.location;
            return redirectUrl;
        }
    }

    /**
     * 处理Bangumi的媒体
     * @returns 
     */
    private async handleBilibiliBangumi()
    {
        const mediaData = this.returnMediaData();
        const regex = /\/ep(\d+)/;
        const match = this.originUrl.match(regex);
        if (match)
        {
            const ep: number = parseInt(match[1], 10);
            const bangumiInfo = await this.getBangumiData(ep);
            let bangumiStream = await this.getBangumiStream(ep);

            while (await this.checkResponseStatus(bangumiStream.durl[0].url) === false)
            {
                this.changeBilibiliQn();
                bangumiStream = await this.getBangumiStream(ep);
                if (this.biliBiliqn === 6) break;
            }


            const targetEpisodeInfo = bangumiInfo.episodes.find(episodes => episodes.ep_id === ep);
            mediaData.bitRate = this.getQuality(bangumiStream.quality);
            mediaData.cover = targetEpisodeInfo.cover;
            mediaData.duration = (targetEpisodeInfo.duration / 1000) + 1;
            mediaData.link = bangumiStream.durl[0].url;
            mediaData.url = bangumiStream.durl[0].url;
            mediaData.name = targetEpisodeInfo.share_copy;
            mediaData.type = 'video';
            mediaData.signer = bangumiInfo.up_info.uname || '未定';

            // console.log(bangumiInfo.episodes)
            // console.log(bangumiStream)
            return mediaData;


        }
    }

    /**
     * 主要获取Bangumi的url
     * @param avid bilibili avid
     * @param bvid bilibili bvid
     * @param cid bilibili cid
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
            'Referer': 'https://www.bilibili.com/',
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
        } catch (error)
        {
            throw new Error(error.message);
        }
    }

    /**
     * 主要获取Bangumi的各种信息
     * @param ep 
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
        } catch (error)
        {
            console.error('Error:', error.message);
        }

    }

    /**
     * 处理bilibili的媒体
     * @returns 
     */
    private async handleBilibiliMedia()
    {
        const mediaData = this.returnMediaData();
        try
        {
            let bvid: string;
            if (this.originUrl.includes('http') && this.originUrl.includes('video'))
            {
                bvid = this.originUrl.split('/video/')[1].split('/')[0];
            } else if (this.originUrl.includes('BV'))
            {
                bvid = this.originUrl;
            } else
            {
                mediaData.error = '暂不支持';
                return mediaData;
            }
            const videoInfo = await this.getBilibiliVideoData(bvid);
            if (!videoInfo)
            {
                mediaData.error = '这个不是正确的bv号';
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

            mediaData.bitRate = this.getQuality(videoStream.quality);


            mediaData.cover = videoInfo.pic;
            mediaData.duration = videoInfo.duration + 1;
            mediaData.link = videoStream.durl[0].url;
            mediaData.url = videoStream.durl[0].url;
            mediaData.name = videoInfo.title;
            mediaData.type = 'video';
            mediaData.url = videoStream.durl[0].url;
            mediaData.signer = videoInfo.owner.name;
            // console.log(videoStream)
            // console.log(videoInfo)

            return mediaData;
        } catch (error)
        {
            mediaData.error = error;
            return mediaData;
        }

    }

    /**
     * 检查看看一个url是否返回403，或者无法访问
     * @param videoStream 
     * @returns boolean
     */
    private async checkResponseStatus(url)
    {
        try
        {
            const response = await axios.head(url);
            // console.log(`response.status: ${response.status}`)
            if (response.status === 403)
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
        } catch (error)
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
            Referer: 'https://www.bilibili.com/'
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
        } catch (error)
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
     * @param quality 
     * @returns 
     */
    private getQuality(qn)
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
     * @description 尝试获取媒体的信息
     * @returns 
     */
    private async getMedia(): Promise<MediaData>
    {
        const resourceUrls: string[] = [];
        const mediaData = this.returnMediaData();
        try
        {
            this.page.on('request', async request => {
                const url = await request.url();
                await new Promise(resolve => setTimeout(resolve, 1000))
                const response = await request.response();
                if(url.includes('video.acfun.cn')){
                    console.log(`url: ${url}\nresponse: ${response}`)
                }
                
                if (response) {
                    const checkMimeType = new CheckMimeType();
                    const mimeType = response.headers()['content-type'];
                    
                    if (checkMimeType.isVideo(mimeType) && !url.includes('p-pc-weboff')) {
                        processMedia('video', url, mimeType);
                    } else if (checkMimeType.isMusic(mimeType) && !url.includes('p-pc-weboff')) {
                        processMedia('music', url, mimeType);
                    }
                } else if (url.includes('.m3u8') || url.includes('.m4a')) {
                    const mediaType = url.includes('.m4a') ? 'music' : 'video';
                    processMedia(mediaType, url, null);
                    // console.error(`No response for (is m3u8 or m4a): ${url}`);
                }
            });
            

            
            function processMedia(type, url, mimeType) {
                console.log('>>', type, url, mimeType);
                resourceUrls.push(url);
                mediaData.type = type;
                mediaData.link = resourceUrls[0];
                mediaData.url = resourceUrls[0];
            }
            await this.page.goto(this.originUrl, { timeout: this.timeOut });
            await this.clickBtn();
            await this.page.waitForTimeout(this.waitTime);
            if (mediaData.type === 'video') mediaData.cover = await this.getThumbNail() || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
            if (mediaData.type === 'music') mediaData.cover = await this.searchImg() || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
            mediaData.name = await this.page.title() || '无法获取标题';
        } catch (error)
        {
            console.log(error);
            mediaData.link = resourceUrls[0];
            mediaData.url = resourceUrls[0];
            mediaData.error = await this.errorHandle.ErrorHandle(error.message);
            return mediaData;
        }
        mediaData.link = resourceUrls[0];
        mediaData.url = resourceUrls[0];

        return mediaData;
    }

    /**
     * 获取缩略图
     * @returns 
     */
    private async getThumbNail(): Promise<string>
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
     */
    private async clickBtn()
    {
        // 获取所有的 iframe
        const frames = this.page.frames();
        let elementHandle;

        // 如果存在 iframe
        if (frames.length > 1)
        {
            for (let frame of frames)
            {
                // 在 iframe 中查找所有元素
                const elements = await frame.$$('body *');
                for (let element of elements)
                {
                    // 获取元素的所有属性值和类名
                    const attributes = await element.evaluate(node =>
                    {
                        const attrs = [...node.attributes].map(attr => ({ name: attr.name, value: attr.value }));
                        return { tagName: node.tagName, attrs, classList: [...node.classList] };
                    });
                    // 检查属性值或类名是否包含 "play" 作为一个单独的单词
                    if (attributes.attrs.some(attr => new RegExp('\\bplay\\b').test(attr.value)) || attributes.classList.includes('play'))
                    {
                        // 检查元素是否在视口内
                        const isVisible = await element.evaluate(node =>
                        {
                            const rect = node.getBoundingClientRect();
                            return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                        });
                        if (isVisible)
                        {
                            elementHandle = element;
                            break;
                        }
                    }
                }
                if (elementHandle) break;
            }
        }

        // 如果不存在 iframe 或在 iframe 中未找到元素
        if (!elementHandle)
        {
            // 在主页面中查找所有元素
            const elements = await this.page.$$('body *');
            for (let element of elements)
            {
                // 获取元素的所有属性值和类名
                const attributes = await element.evaluate(node =>
                {
                    const attrs = [...node.attributes].map(attr => ({ name: attr.name, value: attr.value }));
                    return { tagName: node.tagName, attrs, classList: [...node.classList] };
                });
                // 检查属性值或类名是否包含 "play" 作为一个单独的单词
                if (attributes.attrs.some(attr => new RegExp('\\bplay\\b').test(attr.value)) || attributes.classList.includes('play'))
                {
                    // 检查元素是否在视口内
                    const isVisible = await element.evaluate(node =>
                    {
                        const rect = node.getBoundingClientRect();
                        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                    });
                    if (isVisible)
                    {
                        elementHandle = element;
                        break;
                    }
                }
            }
        }

        // 如果找到了元素，执行点击操作
        if (elementHandle)
        {
            const elementInfo = await elementHandle.evaluate(node =>
            {
                return {
                    tagName: node.tagName,
                    attributes: [...node.attributes].map(attr => ({ name: attr.name, value: attr.value })),
                    classList: [...node.classList]
                };
            });
            console.log('Element TagName:', elementInfo.tagName);
            console.log('Element Attributes:', elementInfo.attributes);
            console.log('Element ClassList:', elementInfo.classList);
            await elementHandle.click();
        }
    }

    /**
     * 查找特定的图片，音乐网站会用到
     * @returns 
     */
     private async searchImg() {
        const frames = this.page.frames();
      
        for (const frame of frames) {
          const imgsInFrame = await frame.$$('img');
          for (const img of imgsInFrame) {
            const dataSrc = await img.evaluate(element => element.getAttribute('data-src'));
            if (dataSrc) return dataSrc;
          }
        }
      
        const imgsInDocument = await this.page.$$('img');
        for (const img of imgsInDocument) {
          const dataSrc = await img.evaluate(element => element.getAttribute('data-src'));
          if (dataSrc) return dataSrc;
        }
      }
      















}