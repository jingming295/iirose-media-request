import { chromium } from 'playwright';

export class MediaParsing {

    async getVideos(url: string) {
        const browser = await chromium.launch();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            viewport: { width: 1440, height: 768 },
            extraHTTPHeaders: {
              'Accept-Encoding': 'gzip, deflate, br',
              'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
              'X-Robots-Tag': 'noindex, nofollow'
            }
          });
        
        const page = await context.newPage();
        
        await page.goto(url, { timeout: 60000 });
        
        // 等待一些时间以确保所有资源加载完成
        // await page.waitForTimeout(5000);
        
        const resourceUrls = await page.evaluate(() => {
            const resources: string[] = [];
            const elements = document.querySelectorAll('*');

            for (const element of elements) {
                if (element instanceof HTMLIFrameElement) {
                    const iframeSrc = element.src;
                    if (iframeSrc && !iframeSrc.endsWith('.html')) {
                        let src = urlparsing(iframeSrc);
                        resources.push(src);
                        break;
                    }
                } else if (element instanceof HTMLVideoElement && element.src) {
                    resources.push(element.src);
                } else if (element instanceof HTMLLinkElement && element.href) {
                    // resources.push(element.href);
                } else if (element instanceof HTMLScriptElement && element.src) {
                    // resources.push(element.src);
                } else if (element instanceof HTMLIFrameElement) {
                
                } else {
                    // const url = (element as HTMLImageElement).src || (element as HTMLAnchorElement).href;
                    // if (url && typeof url === 'string' && !url.endsWith('.js') && 
                    // !url.endsWith('.css') && !url.endsWith('.html') && 
                    // !url.endsWith('.png') && !url.includes('javascript') && 
                    // !url.includes('javascript') && !url.startsWith('data:') && !url.endsWith('.xml') ) {
                    //     resources.push(url);
                    // }
                }
            }
            

            return resources;

            function urlparsing(url: string) {
                const regex = /http.*http/g;
                    const match = regex.exec(url);
                    if (match) {
                        const startIndex = match[0].lastIndexOf('http');
                        const parsedUrl = decodeURIComponent(url.substring(startIndex));
                        return parsedUrl;
                    }
                    return url;
            }
        });
        
        await browser.close();

        return resourceUrls

        // return this.getMimeType(resourceUrls);
    }

    async getMimeType(url: string []) {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        const type: string[] = [];
        
        await Promise.all(url.map(async (url) => {
            const response = await page.goto(url);
            const mimeType = response.headers()['content-type'];
            type.push(`${url}: ${mimeType}`);
        }));
    
        await browser.close();
        return type;
    }
    


    
}
