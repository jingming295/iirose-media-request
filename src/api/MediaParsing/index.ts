import  { Browser, BrowserContext, Page, firefox } from 'playwright';
import { CheckMimeType } from '../tools/checkMimeType'
import { ErrorHandle } from '../ErrorHandle';
import { DownloadBrowser } from '../Browser/index'
import { GetMediaLength } from '../tools/getMediaLength'
import sharp from 'sharp';
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
     * @param page 
     * @returns 
     */
    private async getMedia() {
        const resourceUrls: string [] = []
        let title:string;
        const mediaData = this.returnMediaData()
        try {
            this.page.on('request', async request => {
                const url = request.url();
                    const response = await request.response();
                    if (response) { // 添加错误处理，确保 response 不是 null
                        const checkMimeType = new CheckMimeType()
                        const mimeType = response.headers()['content-type'];
                        if(checkMimeType.isVideo(mimeType) && !url.includes('p-pc-weboff')) {
                            console.log('>>', request.method(), url, mimeType);
                            title = await this.page.title();
                        
                            resourceUrls.push(url); mediaData.type = 'video'
                        } else if (checkMimeType.isMusic(mimeType) && !url.includes('p-pc-weboff')){
                            console.log('>>', request.method(), url, mimeType);
                            title = await this.page.title();
                     
                            resourceUrls.push(url); mediaData.type = 'music'
                        }
                        
                    } else if (!response) {
                        if (url.includes('m3u8')) {
                            resourceUrls.push(url)
                            title = await this.page.title();
                            mediaData.link = resourceUrls[0]
                            mediaData.url = resourceUrls[0]
                        }
                        console.error('No response for:', url);
                    }
                
            });
            await this.page.goto(this.originUrl, { timeout: this.timeOut });
            await this.page.waitForTimeout(this.waitTime);
            if (mediaData.type = 'video') mediaData.cover = await this.getThumbNail()
            
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

    private async getThumbNail() {
        const videoElement = await this.page.$('video');
        const iframeElement = await this.page.$('iframe');
        if (iframeElement) {
            // 在iframe中寻找video元素
            const frame = await iframeElement.contentFrame();
            const videoInsideIframe = await frame.$('body video');
            if (videoInsideIframe) {
                  await videoInsideIframe.screenshot({ 
                    path: 'thumbnail.png',
                })
                const blurredImageBuffer = await sharp('thumbnail.png')
                .resize({ width: 160, height: 100 }) // 调整图像尺寸
                .jpeg({ quality: 95 }) // 调整JPEG图像质量，数值越低，文件越小
                .toBuffer();
                const base64BlurredImage = `data:image/png;base64,${blurredImageBuffer.toString('base64')}`;
                console.log(base64BlurredImage);
                return base64BlurredImage
              } else return 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg'
                

        } else if (videoElement) {
            await videoElement.screenshot({ path: 'thumbnail.png' });
            const blurredImageBuffer = await sharp('thumbnail.png')
                .resize({ width: 160, height: 100 }) // 调整图像尺寸
                .jpeg({ quality: 95 }) // 调整JPEG图像质量，数值越低，文件越小
                .toBuffer();
                const base64BlurredImage = `data:image/png;base64,${blurredImageBuffer.toString('base64')}`;
                console.log(base64BlurredImage);
                return base64BlurredImage
        } else return 'https://cloud.ming295.com/f/zrTK/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg'
    }

}