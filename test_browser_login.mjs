import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  브라우저 로그인 테스트');
  console.log('  URL: https://superplacestudy.pages.dev/login/');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 페이지 로드
    console.log('1️⃣  페이지 로드 중...');
    await page.goto('https://superplacestudy.pages.dev/login/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('   ✅ 페이지 로드 완료\n');

    // 로그인 폼 요소 확인
    console.log('2️⃣  로그인 폼 확인 중...');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.waitFor({ timeout: 5000 });
    console.log('   ✅ 로그인 폼 확인 완료\n');

    // 테스트 계정으로 로그인
    console.log('3️⃣  로그인 시도 중...');
    console.log('   계정: admin@superplace.com');
    console.log('   비밀번호: admin1234');
    
    await emailInput.fill('admin@superplace.com');
    await passwordInput.fill('admin1234');
    await submitButton.click();

    // 페이지 변경 대기 (최대 10초)
    console.log('   로그인 처리 중...\n');
    await page.waitForTimeout(3000);

    const currentURL = page.url();
    console.log(`4️⃣  현재 URL: ${currentURL}`);
    
    if (currentURL.includes('/dashboard')) {
      console.log('   ✅ 로그인 성공! 대시보드로 이동됨\n');
      
      // localStorage 확인
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const user = await page.evaluate(() => localStorage.getItem('user'));
      
      if (token && user) {
        console.log('5️⃣  인증 정보 확인:');
        console.log(`   토큰: ${token.substring(0, 50)}...`);
        const userData = JSON.parse(user);
        console.log(`   사용자: ${userData.name} (${userData.role})\n`);
      }
    } else {
      console.log('   ⚠️  로그인 페이지에 머물러 있음\n');
      
      // 에러 메시지 확인
      const errorDiv = page.locator('.text-destructive').first();
      const errorText = await errorDiv.textContent().catch(() => null);
      if (errorText) {
        console.log(`   ❌ 에러 메시지: ${errorText}\n`);
      }
    }

    // 콘솔 로그 출력
    if (logs.length > 0) {
      console.log('📋 브라우저 콘솔 로그:');
      logs.forEach(log => console.log(`   ${log}`));
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  테스트 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n📋 콘솔 로그:');
    logs.forEach(log => console.log(`   ${log}`));
  } finally {
    await browser.close();
  }
})();
