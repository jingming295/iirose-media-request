import { test,firefox } from '@playwright/test';
import { DownloadBrowser } from '../src/api/Browser';
import sharp from 'sharp'

test('test', async ({  }) => {
    const downloadBrowser = new DownloadBrowser();
    const firefoxPath = await downloadBrowser.downloadFirefox();
    const browser = await firefox.launch({
        executablePath: firefoxPath
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
        viewport: { width: 1440, height: 768 },
        extraHTTPHeaders: {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8'
        }
    });
    const page = await context.newPage();
    await page.goto('https://www.yhmgo.com/vp/23083-2-0.html', { timeout: 50000 });
    await page.waitForTimeout(8000);

    const videoElement = await page.$('video');
    const iframeElement = await page.$('iframe');
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
            const base64BlurredImage = blurredImageBuffer.toString('base64');
            console.log(base64BlurredImage);
            console.log('缩略图已保存');
          } else {
            console.log('未找到嵌套在iframe中的video元素');
          }
    } else if (videoElement) {
        // 等待3秒
        await videoElement.screenshot({ path: 'thumbnail.png' });
        console.log('缩略图已保存');
    } else {
        console.log('未找到video元素');
    }

    // await browser.close();
    });