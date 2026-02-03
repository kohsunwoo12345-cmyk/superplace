const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Console 로그 캡처
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });
  
  // 네트워크 요청 캡처
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/auth/login')) {
      console.log('LOGIN API RESPONSE:', response.status());
      try {
        const body = await response.text();
        console.log('RESPONSE BODY:', body);
      } catch (e) {
        console.log('Could not read response body');
      }
    }
  });
  
  await page.goto('https://genspark-ai-developer.superplacestudy.pages.dev/login');
  
  // 로그인 시도
  await page.type('#email', 'admin@superplace.com');
  await page.type('#password', 'admin123456');
  await page.click('button[type="submit"]');
  
  // 응답 대기
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
