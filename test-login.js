const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 로그인 페이지 접속 중...');
    await page.goto('https://3011-iftozwzhzim0qta6v3gft-b237eb32.sandbox.novita.ai/auth/signin', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('✅ 페이지 로드 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 로그인 폼 확인
    const emailInput = await page.$('input[name="email"]');
    const passwordInput = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
      console.error('❌ 로그인 폼을 찾을 수 없습니다.');
      await browser.close();
      return;
    }
    
    console.log('✅ 로그인 폼 확인 완료');
    
    // 관리자 정보 입력
    console.log('📝 관리자 정보 입력 중...');
    await page.type('input[name="email"]', 'admin@superplace.com', { delay: 50 });
    await page.type('input[name="password"]', 'admin123!@#', { delay: 50 });
    
    console.log('📧 이메일: admin@superplace.com');
    console.log('🔑 비밀번호: admin123!@#');
    
    // 로그인 버튼 클릭
    console.log('🖱️  로그인 버튼 클릭...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('🔗 현재 URL:', currentUrl);
    
    // 에러 메시지 확인
    const errorMessage = await page.$eval('.bg-destructive\\/10', el => el.textContent).catch(() => null);
    if (errorMessage) {
      console.log('❌ 에러 메시지:', errorMessage.trim());
    }
    
    // 대시보드로 이동했는지 확인
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 로그인 성공! 대시보드로 이동했습니다.');
      
      // 사용자 정보 확인
      const userInfo = await page.$eval('body', () => {
        const userElement = document.querySelector('[class*="user"]');
        return userElement ? userElement.textContent : 'N/A';
      }).catch(() => 'N/A');
      
      console.log('👤 사용자 정보:', userInfo);
      
      // 스크린샷 저장
      await page.screenshot({ path: '/home/user/webapp/login-success.png', fullPage: true });
      console.log('📸 스크린샷 저장: login-success.png');
    } else {
      console.log('❌ 로그인 실패. 페이지가 이동하지 않았습니다.');
      
      // 스크린샷 저장
      await page.screenshot({ path: '/home/user/webapp/login-failed.png', fullPage: true });
      console.log('📸 스크린샷 저장: login-failed.png');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    // 에러 스크린샷
    await page.screenshot({ path: '/home/user/webapp/login-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: login-error.png');
  } finally {
    await browser.close();
  }
})();
