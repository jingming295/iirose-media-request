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
    public async openBrowser(ctx: Context, originUrl: string, timeOut: number, waitTime: number, maxCpuUsage: number)
    {
        let intervalId;
        if (!await ctx.puppeteer)
        {
            const mediaData = this.returnErrorMediaData('puppeteer 未安装或没有正确配置，请在插件市场安装');
            return mediaData;
        }
        const page = await ctx.puppeteer.page();
        try
        {

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
    private async getMedia(page: Page, originUrl: string, timeOut: number, waitTime: number, ctx: Context, client: CDPSession): Promise<MediaData>
    {
        function processMedia(type: 'music' | 'video', url: string, mimeType: string | null)
        {
            console.log('>>', type, url, mimeType);
            resourceUrls[urlCount] = {
                url: url,
                mimetype: mimeType
            };
            mediaType = type;
            urlCount = urlCount + 1;
            if (resourceUrls.length >= 1 && !isstopLoading)
            {
                isstopLoading = 1;
                client.send('Page.stopLoading');
            }
        }

        function isPageClosed()
        {
            return page.isClosed();
        }
        let urlCount = 0;
        let mediaType: 'music' | 'video' | null = null;
        let name: string;
        let cover: string | null = null;
        let isstopLoading = 0;
        const resourceUrls: ResourceUrls[] = [
            { url: null, mimetype: null }
        ];


        try
        {
            if (isPageClosed()) return this.returnErrorMediaData(`页面被软件关闭，极有可能是CPU占用率达到阈值`);
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

            if (isPageClosed()) return this.returnErrorMediaData(`页面被软件关闭，极有可能是CPU占用率达到阈值`);
            await page.goto(originUrl, { timeout: timeOut });
            if (isPageClosed()) return this.returnErrorMediaData(`页面被软件关闭，极有可能是CPU占用率达到阈值`);
            await page.waitForTimeout(waitTime);
            if (isPageClosed()) return this.returnErrorMediaData(`页面被软件关闭，极有可能是CPU占用率达到阈值`);
            await this.clickBtn(page);
            if (mediaType)
            {
                if (isPageClosed()) return this.returnErrorMediaData(`页面被软件关闭，极有可能是CPU占用率达到阈值`);
                cover = (mediaType === 'video') ? await this.getThumbNail(page) : await this.searchImg(page);
            }

            if (isPageClosed()) return this.handleError(new Error(`页面被软件关闭，极有可能是CPU占用率达到阈值`));
            name = await page.title() || '无法获取标题';
            return this.processMediaData(resourceUrls, mediaType, cover, name, ctx);
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
    private async processMediaData(resourceUrls: ResourceUrls[], mediaType: 'music' | 'video' | null, cover: string | null, name: string, ctx: Context): Promise<MediaData>
    {
        let url: string;
        let mimeType: string | null;
        const signer: string = '无法获取';
        const bitRate: number = 720;
        let duration: number;

        if (resourceUrls[0].url && resourceUrls.length > 0)
        {
            url = resourceUrls[0].url;
            mimeType = resourceUrls[0].mimetype;

            if (mediaType != null && cover)
            {
                const getMediaLength = new GetMediaLength();
                duration = await getMediaLength.GetMediaLengthByReadMetaData(url, mimeType, ctx);
                return this.returnCompleteMediaData(mediaType, name, signer, cover, url, duration, bitRate);
            } else
            {
                return this.returnErrorMediaData('<>没有找到媒体，主要是无法获取type或者cover</>');
            }
        } else
        {
            return this.returnErrorMediaData('<>没有找到媒体</>');
        }
    }

    /**
     * 处理错误
     * @param error 错误
     * @returns 
     */
    public handleError(error: Error)
    {
        return this.returnErrorMediaData(this.errorHandle.ErrorHandle(error.message));
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
