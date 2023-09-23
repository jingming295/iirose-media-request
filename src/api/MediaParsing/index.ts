import  { Browser, BrowserContext, Page, firefox } from 'playwright';

/**
 * @description 
 */
export class MediaParsing {

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
        this.browser = await firefox.launch();
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
        const url = await this.getVideos();
        if (this.browser.isConnected()){
            await this.browser.close();
        }
        
        return url
    }

    /**
     * @description 主要处理url应该去哪里
     * @returns 
     */
    async getVideos() {

        const resourceUrls = await this.getMediaUrl();

        console.log(resourceUrls)

        let mediaUrl:string

        if(resourceUrls.length === 1) return mediaUrl = resourceUrls[0]

        return mediaUrl = resourceUrls[0]

        // return this.getMimeType(resourceUrls);
    }

    /**
     * @description 匹配以这些后缀结尾
     * @param url 要被匹配的url
     * @returns true | false
     */
    pairExtension(url:string) {
        const videoExtensions = /\.(m3u8)$/i;
        if (videoExtensions.test(url)) return true
        return false
    }

    /**
     * @description 尝试获取媒体的url
     * @param page 
     * @returns 
     */
    async getMediaUrl() {
        const resourceUrls: string [] = []
        
        this.page.on('request', async request => {
            const url = request.url();
            // application/vnd.apple.mpegURL 

                const response = await request.response();
                if (response) { // 添加错误处理，确保 response 不是 null
                    const mimeType = response.headers()['content-type'];
                    if(
                        mimeType === 'video/mp4' || mimeType === 'application/vnd.apple.mpegURL' || 
                        mimeType === 'application/vnd.apple.mpegurl') {
                        console.log('>>', request.method(), url, mimeType);
                        if(resourceUrls.length >=3) await this.browser.close()
                        else resourceUrls.push(url)
                    }
                    
                } else {
                    if (url.includes('m3u8')) resourceUrls.push(url)
                    console.error('No response for:', url);
                }
            
        });

        await this.page.goto(this.originUrl);
        await this.page.waitForTimeout(1000);


        return resourceUrls;
    }
}
