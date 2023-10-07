import { test, firefox, Page } from '@playwright/test';
import { DownloadBrowser } from './api/Browser';
import { CheckMimeType } from './api/tools/checkMimeType';

test('test', async ({ }) =>
{
    const downloadBrowser = new DownloadBrowser();
    const firefoxPath = await downloadBrowser.downloadFirefox();
    const browser = await firefox.launch({
        executablePath: firefoxPath,
        ignoreDefaultArgs: ['--mute-audio']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
        viewport: { width: 1440, height: 768 },
        extraHTTPHeaders: {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8'
        }
    });

    await context.addCookies([
        {
            url: 'https://cn.pornhub.com/view_video.php?viewkey=646793e8ddc6a', // 请将此替换为目标网站的URL
            name: 'accessAgeDisclaimerPH',
            value: '1'
        }
    ]);
    const page = await context.newPage();

    page.on('request', async request =>
    {
        const url = request.url();
        const response = await request.response();
        if (response)
        { // 添加错误处理，确保 response 不是 null
            const checkMimeType = new CheckMimeType();
            const mimeType = response.headers()['content-type'];
            if (checkMimeType.isVideo(mimeType) || url.includes('m3u8') && !url.includes('p-pc-weboff'))
            {
                console.log('>>', request.method(), url, mimeType);
            } else if (checkMimeType.isMusic(mimeType) && !url.includes('p-pc-weboff'))
            {
                console.log('>>', request.method(), url, mimeType);
            }
        } else if (!response)
        {
            if (url.includes('m3u8') || url.includes('m4a'))
            {
                console.error(`No response for (is m3u8 or m4a): ${url}`);
            }
            console.error('No response for:', url);
        }

    });

    const originUrl = 'https://cn.pornhub.com/view_video.php?viewkey=ph6353fa30e62c1'
    await page.goto(originUrl, { timeout: 90000 });


    // await clickBtn(page)

    if (originUrl.includes('pornhub')) {
        try {
            await page.waitForTimeout(1000);
            const skipButton = await page.$('.mgp_adRollSkipButton');
            if (skipButton) {
                await page.waitForTimeout(6000);
                const skipButtonText = await page.evaluate(button => button.textContent, skipButton);
                console.log('Skip Ad Button:', skipButtonText);
                await skipButton.click(); // 尝试点击按钮
            } else {
                console.log('未找到跳过广告按钮');
            }
        } catch (error) {
            console.error('发生错误:', error);
        }
    }
    
    await page.waitForTimeout(2000);



    // await browser.close();
});

async function clickBtn(page: Page)
{
    // 获取所有的 iframe
    const frames = page.frames();
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
        const elements = await page.$$('body *');
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



