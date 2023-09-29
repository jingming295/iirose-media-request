import  { Browser, BrowserContext, Page, firefox } from 'playwright';
import { CheckMimeType } from '../tools/checkMimeType'
import { ErrorHandle } from '../ErrorHandle';
import { DownloadBrowser } from '../Browser/index'
import { GetMediaLength } from '../tools/getMediaLength'
/**
 * @description 
 */
export class MediaParsing {
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
    constructor(url:string){
        this.originUrl = url
    }
    

    /**
     * @description 只需要开一个browser就好了
     * @returns 
     */
    async openBrowser() {
        let mediaData = this.mediaData
        try{
            const downloadBrowser = new DownloadBrowser();
            const firefoxPath = await downloadBrowser.downloadFirefox();
            console.log(firefoxPath)
            this.browser = await firefox.launch({
                executablePath: firefoxPath
              });
            
            // this.browser = await firefox.launch();
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
            console.log(error)
            
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
     * @description 尝试获取媒体的url
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
                        if(resourceUrls.length>=3) await this.browser.close()
                        else resourceUrls.push(url); mediaData.type = 'video'
                    } else if (checkMimeType.isMusic(mimeType) && !url.includes('p-pc-weboff')){
                        console.log('>>', request.method(), url, mimeType);
                        title = await this.page.title();
                        if(resourceUrls.length>=3) await this.browser.close()
                        else resourceUrls.push(url); mediaData.type = 'music'
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

        
            await this.page.goto(this.originUrl);
            await this.page.waitForTimeout(3000);
        } catch(error) {
            console.error(`Error:, ${error.message} in `);
            mediaData.name = title
            mediaData.link = resourceUrls[0]
            mediaData.url = resourceUrls[0]
            mediaData.error = error.message
            return mediaData
        }

        
        mediaData.name = title
        mediaData.link = resourceUrls[0]
        mediaData.url = resourceUrls[0]


        return mediaData;
    }

}
