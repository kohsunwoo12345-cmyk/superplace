const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 로그인 페이지 접속...');
    await page.goto('https://genspark-ai-developer.superplacestudy.pages.dev/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📝 로그인 정보 입력...');
    await page.fill('input[type="email"]', 'admin@superplace.co.kr');
    await page.fill('input[type="password"]', 'admin1234!');

    console.log('🔐 로그인 버튼 클릭...');
    await page.click('button[type="submit"]');

    // 대시보드로 이동 대기
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ 대시보드 페이지 이동 완료');

    // localStorage 확인
    const user = await page.evaluate(() => {
      return localStorage.getItem('user');
    });
    console.log('👤 저장된 사용자 정보:', user);

    const userObj = JSON.parse(user);
    console.log('📊 사용자 role:', userObj.role);

    // 페이지 대기
    await page.waitForTimeout(2000);

    // 관리자 메뉴 확인
    const adminMenuVisible = await page.evaluate(() => {
      const adminText = document.body.innerText;
      return adminText.includes('관리자 메뉴') || adminText.includes('시스템 관리자');
    });

    console.log('🎯 관리자 메뉴 표시 여부:', adminMenuVisible);

    // 사이드바 확인
    const sidebarText = await page.evaluate(() => {
      return document.querySelector('aside')?.innerText || 'No sidebar found';
    });
    console.log('📋 사이드바 내용:\n', sidebarText);

    // 메인 대시보드 확인
    const mainText = await page.evaluate(() => {
      return document.querySelector('main')?.innerText.substring(0, 500) || 'No main content';
    });
    console.log('📄 메인 콘텐츠 (처음 500자):\n', mainText);

    // 스크린샷 저장
    await page.screenshot({ path: '/home/user/webapp/admin-dashboard-screenshot.png', fullPage: true });
    console.log('📸 스크린샷 저장 완료: admin-dashboard-screenshot.png');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    await browser.close();
  }
})();
