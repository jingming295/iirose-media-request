import  { Browser, BrowserContext, ElementHandle, Page, firefox } from 'playwright';
import { CheckMimeType } from '../tools/checkMimeType'
import { ErrorHandle } from '../ErrorHandle';
import { DownloadBrowser } from '../Browser/index'
import { GetMediaLength } from '../tools/getMediaLength'
import Jimp from 'jimp';
import * as os from 'os';
/**
 * @description 
 */
export class MediaParsing {
    timeOut:number
    waitTime:number
    mediaData:MediaData = {
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
    }
    errorHandle = new ErrorHandle()
    originUrl:string
    browser:Browser
    context:BrowserContext
    page:Page

    /**
     * 
     * @param url 原始网站的url
     */
    constructor(url:string, timeOut:number, waitTime:number){
        this.originUrl = url
        this.timeOut = timeOut
        this.waitTime = waitTime

    }
    

    /**
     * @description 只需要开一个browser就好了
     * @returns 
     */
    async openBrowser() {
        let mediaData = this.mediaData
        const downloadBrowser = new DownloadBrowser();
        const firefoxPath = await downloadBrowser.downloadFirefox();
        if (firefoxPath === null) {
            mediaData.error = '暂不支持此操作系统'
            return mediaData
        } 
        try{
 
            this.browser = await firefox.launch({
                executablePath: firefoxPath,
                ignoreDefaultArgs: ['--mute-audio']
              });
            
            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
                viewport: { width: 1440, height: 768 },
                extraHTTPHeaders: {
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
                'X-Robots-Tag': 'noindex, nofollow'
                }
            });
            
            this.page = await this.context.newPage();
            mediaData = await this.getVideos();
        
            if (this.browser.isConnected()){
                await this.browser.close();
            }
            return mediaData
        }catch(error){
            mediaData.error = await this.errorHandle.ErrorHandle(error.message)
            
            return mediaData
        }
        
        
    }

    returnMediaData() {
        const mediaData:MediaData = {
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
        }
        return mediaData
    }

    /**
     * @description 主要处理url应该去哪里
     * @returns 
     */
    private async getVideos() {
        const getMediaLength = new GetMediaLength
        const MediaData = await this.getMedia();
        if(MediaData.url != null || MediaData.url != undefined) {
            MediaData.duration = await getMediaLength.mediaLengthInSec(MediaData.url)
        }
        return MediaData
    }

    /**
     * @description 尝试获取媒体的信息
     * @returns 
     */
    private async getMedia(): Promise<MediaData> {
        const resourceUrls: string [] = []
        let title = '未定';
        const mediaData = this.returnMediaData()
        try {
            this.page.on('request', async request => {
                const url = request.url();
                    const response = await request.response();
                    if (response) { // 添加错误处理，确保 response 不是 null
                        const checkMimeType = new CheckMimeType()
                        const mimeType = response.headers()['content-type'];
                        if(checkMimeType.isVideo(mimeType) || url.includes('m3u8') && !url.includes('p-pc-weboff')) {
                            console.log('>>', request.method(), url, mimeType);
                            resourceUrls.push(url); mediaData.type = 'video'
                        } else if (checkMimeType.isMusic(mimeType) && !url.includes('p-pc-weboff')){
                            console.log('>>', request.method(), url, mimeType);
                            resourceUrls.push(url); mediaData.type = 'music'
                        }
                    } else if (!response) {
                        if (url.includes('m3u8') || url.includes('m4a')) {
                            resourceUrls.push(url)
                            mediaData.link = resourceUrls[0]
                            mediaData.url = resourceUrls[0]
                            console.error('No response for:', url);
                        }
                        console.error('No response for:', url);
                    }
                
            });
            await this.page.goto(this.originUrl, { timeout: this.timeOut });
            await this.clickBtn()
            await this.page.waitForTimeout(this.waitTime);
            title = await this.page.title();
            mediaData.name = title
            if (mediaData.type === 'video') mediaData.cover = await this.getThumbNail()
            else mediaData.cover = 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg'
        } catch(error) {
            mediaData.name = title
            mediaData.link = resourceUrls[0]
            mediaData.url = resourceUrls[0]
            mediaData.error = await this.errorHandle.ErrorHandle(error.message)
            return mediaData
        }
        mediaData.name = title
        mediaData.link = resourceUrls[0]
        mediaData.url = resourceUrls[0]
        return mediaData;
    }

    private async getThumbNail(): Promise<string> {
        const path = os.homedir();
        const videoElement = await this.page.$('video');
        const iframeElement = await this.page.$('iframe');
        if (iframeElement) {
            // 在iframe中寻找video元素
            const frame = await iframeElement.contentFrame();
            const videoInsideIframe = frame ? await frame.$('body video') : null;
            if (videoInsideIframe) return this.captureThumbnail(videoInsideIframe, `${path}/thumbnail.png`) || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
        } 
        if (videoElement) {
            return this.captureThumbnail(videoElement, `${path}/thumbnail.png`) || 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
        }
    
        return 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg';
    }

    private async captureThumbnail(element: ElementHandle, path: string): Promise<string | null> {
        if (element) {
            await element.screenshot({ path });
            const image = await Jimp.read(path);
            image.resize(160, 100);
            const base64BlurredImage = `data:image/jpeg;base64,${(await image.getBufferAsync(Jimp.MIME_JPEG)).toString('base64')}`;
            return base64BlurredImage;
        }
        return null;
    } 

    private async clickBtn() {
        // 获取所有的 iframe
        const frames = this.page.frames();
        let elementHandle;
    
        // 如果存在 iframe
        if (frames.length > 1) {
            for (let frame of frames) {
                // 在 iframe 中查找所有元素
                const elements = await frame.$$('body *');
                for (let element of elements) {
                    // 获取元素的所有属性值和类名
                    const attributes = await element.evaluate(node => {
                        const attrs = [...node.attributes].map(attr => ({name: attr.name, value: attr.value}));
                        return {tagName: node.tagName, attrs, classList: [...node.classList]};
                    });
                    // 检查属性值或类名是否包含 "play" 作为一个单独的单词
                    if (attributes.attrs.some(attr => new RegExp('\\bplay\\b').test(attr.value)) || attributes.classList.includes('play')) {
                        // 检查元素是否在视口内
                        const isVisible = await element.evaluate(node => {
                            const rect = node.getBoundingClientRect();
                            return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                        });
                        if (isVisible) {
                            elementHandle = element;
                            break;
                        }
                    }
                }
                if (elementHandle) break;
            }
        }
    
        // 如果不存在 iframe 或在 iframe 中未找到元素
        if (!elementHandle) {
            // 在主页面中查找所有元素
            const elements = await this.page.$$('body *');
            for (let element of elements) {
                // 获取元素的所有属性值和类名
                const attributes = await element.evaluate(node => {
                    const attrs = [...node.attributes].map(attr => ({name: attr.name, value: attr.value}));
                    return {tagName: node.tagName, attrs, classList: [...node.classList]};
                });
                // 检查属性值或类名是否包含 "play" 作为一个单独的单词
                if (attributes.attrs.some(attr => new RegExp('\\bplay\\b').test(attr.value)) || attributes.classList.includes('play')) {
                    // 检查元素是否在视口内
                    const isVisible = await element.evaluate(node => {
                        const rect = node.getBoundingClientRect();
                        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                    });
                    if (isVisible) {
                        elementHandle = element;
                        break;
                    }
                }
            }
        }
    
        // 如果找到了元素，执行点击操作
        if (elementHandle) {
            await elementHandle.click();
        }
    }
    
    
    

    

    
    

    
    
    
    

}