import { ErrorHandle } from '../ErrorHandle';
import { GetMediaLength } from '../GetVideoDuration';
import { CDPSession, ElementHandle, Page } from 'koishi-plugin-puppeteer';
import axios from 'axios';
import { CheckMimeType } from '../tools/checkMimeType';
import { Context } from 'koishi';
import osUtils from 'os-utils';


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
        typeList: ('music' | 'video')[],
        nameList: string[],
        signerList: string[],
        coverList: (string | null)[],
        urlList: string[],
        durationList: number[],
        bitRateList: number[]
    )
    {
        const mediaDataArray: MediaData[] = [];

        for (let i = 0; i < typeList.length; i++)
        {
            const mediaData: MediaData = {
                type: typeList[i],
                name: nameList[i],
                signer: signerList[i],
                cover: coverList[i] || 'data:image/jpeg;base64,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',
                link: urlList[i],
                url: urlList[i],
                duration: durationList[i],
                bitRate: bitRateList[i],
                error: null,
            };
            mediaDataArray.push(mediaData);
        }

        return mediaDataArray;
    }


    /**
     * 返回包含错误信息的mediaData
     * @param errorMsg 错误信息
     * @return mediaData
     */
    public returnErrorMediaData(errorMsgs: string[]): MediaData[]
    {
        const errorMediaDataArray: MediaData[] = [];

        for (const errorMsg of errorMsgs)
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
            errorMediaDataArray.push(mediaData);
        }

        return errorMediaDataArray;
    }



    /**
     * 打开页面
     * @returns mediaData
     */
    public async openBrowser(ctx: Context, originUrl: string, timeOut: number, waitTime: number, maxCpuUsage: number)
    {
        let intervalId;
        if (!await ctx.puppeteer)
        {
            const mediaData = this.returnErrorMediaData(['puppeteer 未安装或没有正确配置，请在插件市场安装']);
            return mediaData;
        }
        const page = await ctx.puppeteer.page();
        try
        {

            if (!page)
            {
                const mediaData = this.returnErrorMediaData(['游览器没有正确打开，请检查日志']);
                return mediaData;
            }
            const client = await page.target().createCDPSession();
            await client.send('Page.setDownloadBehavior', {
                behavior: 'deny',
                downloadPath: './',
            });

            // 如果检测到异常的cpu占用率（表示可能是挖矿页面），就关闭页面
            intervalId = setInterval(async () =>
            {
                osUtils.cpuUsage((v) =>
                {
                    if (v > maxCpuUsage)
                    {
                        page.close();
                    }
                });
            }, 1000);

            const mediaData = await this.getMedia(page, originUrl, timeOut, waitTime, ctx, client);
            await this.closePage(page);
            clearInterval(intervalId);
            return mediaData;
        } catch (error)
        {
            await this.closePage(page);
            clearInterval(intervalId);
            const mediaData = this.returnErrorMediaData([this.errorHandle.ErrorHandle((error as Error).message)]);
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
            return false;
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
     * 检查看看一个url是否返回403，或者无法访问
     * @param url  链接
     * @returns boolean
     */
    public async checkResponseStatus(url: string)
    {
        try
        {
            const response = await axios.get(url, {
                headers: {
                    Referer: 'no-referrer',
                    Range: 'bytes=0-10000'
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


    /**
     * 尝试获取媒体的信息
     * @returns 
     */
    private async getMedia(page: Page, originUrl: string, timeOut: number, waitTime: number, ctx: Context, client: CDPSession): Promise<MediaData[]>
    {
        function processMedia(type: 'music' | 'video', url: string, mimeType: string | null)
        {
            console.log('>>', type, url, mimeType);
            resourceUrls[urlCount] = {
                url: url,
                mimetype: mimeType
            };
            mediaType.push(type);
            urlCount = urlCount + 1;
            if (resourceUrls.length >= 1 && !isstopLoading)
            {
                if (!isPageClosed())
                {
                    isstopLoading = 1;
                    client.send('Page.stopLoading');
                }
            }
        }

        function isPageClosed()
        {
            return page.isClosed();
        }
        let urlCount = 0;
        let mediaType: ('music' | 'video')[];
        let name: string[] = [];
        let cover: (string|null)[] = [];
        let isstopLoading = 0;
        const resourceUrls: ResourceUrls[] = [
            { url: null, mimetype: null }
        ];


        try
        {
            if (isPageClosed()) return this.returnErrorMediaData([`页面被软件关闭，极有可能是CPU占用率达到阈值`]);
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
                        await processMedia('video', url, mimeType);
                    } else if (checkMimeType.isMusic(mimeType) && !url.includes('p-pc-weboff'))
                    {
                        await processMedia('music', url, mimeType);
                    }
                } else if (url.includes('.m3u8') || url.includes('.m4a'))
                {
                    const mediaType = url.includes('.m4a') ? 'music' : 'video';
                    processMedia(mediaType, url, null);
                }
            });

            if (isPageClosed()) return this.returnErrorMediaData([`页面被软件关闭，极有可能是CPU占用率达到阈值`]);
            await page.goto(originUrl, { timeout: timeOut });
            if (isPageClosed()) return this.returnErrorMediaData([`页面被软件关闭，极有可能是CPU占用率达到阈值`]);
            if (isPageClosed()) return this.returnErrorMediaData([`页面被软件关闭，极有可能是CPU占用率达到阈值`]);
            await this.clickBtn(page);
            if (mediaType!)
            {
                if (isPageClosed()) return this.returnErrorMediaData([`页面被软件关闭，极有可能是CPU占用率达到阈值`]);
                if (mediaType[0] === 'video')
                {
                    cover[0] = await this.getThumbNail(page);
                } else
                {
                    cover[0] = await this.searchImg(page);

                }
            }
            await page.waitForTimeout(waitTime);
            if (isPageClosed()) return this.handleError(new Error(`页面被软件关闭，极有可能是CPU占用率达到阈值`));
            name[0] = await page.title() || '无法获取标题';
            if(mediaType!&& cover){
                return this.processMediaData(resourceUrls, mediaType, cover, name, ctx);
            } else {
                return this.returnErrorMediaData(['<>没有找到媒体，主要是无法获取type或者cover</>']);
            }
        } catch (error)
        {
            return this.handleError(error as Error);
        }
    }

    /**
     * 处理MediaData
     * @param resourceUrls 
     * @param mediaType 
     * @param cover 
     * @param name 
     * @param ctx 
     * @returns 
     */
    private async processMediaData(resourceUrls: ResourceUrls[], mediaType: ('music' | 'video')[], cover: (string | null)[], name: string[], ctx: Context): Promise<MediaData[]>
    {
        let url: string[] = [];
        let mimeType: string | null;
        const signer: string[] = ['无法获取'];
        const bitRate: number[] = [720];
        let duration: number[] = [];

        if (resourceUrls[0].url && resourceUrls.length > 0)
        {
            url[0] = resourceUrls[0].url;
            mimeType = resourceUrls[0].mimetype;


                const getMediaLength = new GetMediaLength();
                duration[0] = await getMediaLength.GetMediaLength(url[0], mimeType, ctx);
                return this.returnCompleteMediaData(mediaType, name, signer, cover, url, duration, bitRate);

        } else
        {
            return this.returnErrorMediaData(['<>没有找到媒体</>']);
        }
    }

    /**
     * 处理错误
     * @param error 错误
     * @returns 
     */
    public handleError(error: Error)
    {
        return this.returnErrorMediaData([this.errorHandle.ErrorHandle(error.message)]);
    }


    /**
     * 获取缩略图
     * @returns 
     */
    private async getThumbNail(page: Page): Promise<string | null>
    {
        const videoElement = await page.$('video');
        const iframeElements = await page.$$('iframe');

        for (const iframeElement of iframeElements)
        {
            const frame = await iframeElement.contentFrame();
            const videoInsideIframe = frame ? await frame.$('body video') : null;
            if (videoInsideIframe)
            {
                const thumbnail = this.resizeThumbNail(videoInsideIframe);
                if (thumbnail) return thumbnail;
            }
        }

        if (videoElement)
        {
            return this.resizeThumbNail(videoElement);
        }

        return null;
    }



    /**
     * 用截图转换成base64
     * @param element 
     * @param path 
     * @returns base64 image
     */
    private async resizeThumbNail(element: ElementHandle): Promise<string | null>
    {
        if (element)
        {
            const buffer = await element.screenshot({ type: 'jpeg', quality: 5 });
            const base64Image = buffer.toString('base64');
            const base64BlurredImage = `data:image/jpeg;base64,${base64Image}`;
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

                const isInteractable = await element.isIntersectingViewport(); // 检查是否可交互

                if (isVisible && isInteractable)
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
            // const elementInfo = await elementHandle.evaluate((node: Element) =>
            // {
            //     const elem = node as HTMLElement;
            //     return {
            //         tagName: elem.tagName,
            //         attributes: [...elem.attributes].map(attr => ({ name: attr.name, value: attr.value })),
            //         classList: [...elem.classList]
            //     };
            // });

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
        return null;
    }

    /**
     * 关掉页面
     * @param page 页面
     */
    private async closePage(page: Page)
    {
        try
        {
            if (!page.isClosed())
            {
                await page.close();
            }
        } catch (error)
        {

        }
    }
}
