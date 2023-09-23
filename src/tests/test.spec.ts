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

  await page.goto('https://www.example.com', { timeout: 40000 });
  await page.waitForTimeout(15000);

  // await browser.close();
});
