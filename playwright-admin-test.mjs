import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log('🖥️ [BROWSER]', msg.text());
  });

  try {
    console.log('1️⃣ 로그인 페이지 접속...');
    await page.goto('https://genspark-ai-developer.superplacestudy.pages.dev/login');
    await page.waitForLoadState('networkidle');

    console.log('2️⃣ 로그인 정보 입력...');
    await page.fill('input[name="email"]', 'admin@superplace.co.kr');
    await page.fill('input[name="password"]', 'admin1234!');

    console.log('3️⃣ 로그인 버튼 클릭...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    console.log('4️⃣ 대시보드 페이지 대기...');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);

    // localStorage 확인
    const user = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    console.log('👤 저장된 사용자:', user);

    // 페이지 내용 확인
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasAdminDashboard: document.body.innerText.includes('시스템 관리자 대시보드'),
        hasFallbackDashboard: document.body.innerText.includes('Fallback 대시보드'),
        hasAdminMenu: document.body.innerText.includes('관리자 메뉴'),
        bodyPreview: document.body.innerText.substring(0, 500)
      };
    });

    console.log('\n📊 페이지 분석:');
    console.log('- 제목:', pageContent.title);
    console.log('- 관리자 대시보드:', pageContent.hasAdminDashboard ? '✅ 있음' : '❌ 없음');
    console.log('- Fallback 대시보드:', pageContent.hasFallbackDashboard ? '⚠️ 있음' : '✅ 없음');
    console.log('- 관리자 메뉴:', pageContent.hasAdminMenu ? '✅ 있음' : '❌ 없음');
    console.log('\n📄 페이지 내용 미리보기:');
    console.log(pageContent.bodyPreview);

    // 스크린샷 저장
    await page.screenshot({ path: 'admin-dashboard-test.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: admin-dashboard-test.png');

  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    await browser.close();
  }
})();
