import { test,firefox } from '@playwright/test';

test('test', async ({  }) => {
  const browser = await firefox.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
    viewport: { width: 1440, height: 768 },
    extraHTTPHeaders: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8'
    }
});
  const page = await context.newPage();

  await page.goto('https://v.youku.com/v_show/id_XNjAzNzA5OTM0MA==.html?spm=a2hja.14919748_WEBGAME_JINGXUAN.drawer4.d_zj1_3&playMode=pugv&scm=20140719.manual.4471.video_XNjAzNzA5OTM0MA%3D%3D&playMode=pugv', { timeout: 50000 });
  await page.waitForTimeout(15000);

  // await browser.close();
});
