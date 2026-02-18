const { chromium } = require('@playwright/test');

(async () => {
  console.log('\n🚀 브라우저 자동화 로그인 테스트 시작\n');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'log') console.log(`   [브라우저 LOG] ${text}`);
    if (type === 'error') console.error(`   [브라우저 ERROR] ${text}`);
  });
  
  try {
    console.log('1️⃣  로그인 페이지 접속 중...');
    await page.goto('https://superplacestudy.pages.dev/login/', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✅ 페이지 로드 완료\n');
    
    console.log('2️⃣  폼 필드 찾기...');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    console.log('   ✅ 폼 필드 발견\n');
    
    console.log('3️⃣  테스트 계정으로 로그인 시도...');
    console.log('   이메일: admin@superplace.com');
    console.log('   비밀번호: admin1234\n');
    
    await emailInput.fill('admin@superplace.com');
    await passwordInput.fill('admin1234');
    
    // 폼 제출 전 대기
    await page.waitForTimeout(500);
    
    console.log('4️⃣  로그인 버튼 클릭...');
    await submitButton.click();
    
    // 리다이렉트 또는 오류 메시지 대기
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`\n5️⃣  현재 URL: ${currentUrl}`);
    
    // localStorage 확인
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));
    
    console.log('\n6️⃣  인증 정보 확인:');
    console.log(`   토큰: ${token ? '✅ 존재' : '❌ 없음'}`);
    console.log(`   사용자 정보: ${user ? '✅ 존재' : '❌ 없음'}`);
    
    if (token && user) {
      const userData = JSON.parse(user);
      console.log('\n   👤 사용자 정보:');
      console.log(`      이름: ${userData.name}`);
      console.log(`      역할: ${userData.role}`);
      console.log(`      이메일: ${userData.email}`);
    }
    
    if (currentUrl.includes('/dashboard')) {
      console.log('\n✅ 성공: 대시보드로 리다이렉트됨');
      console.log('🎉 로그인 테스트 통과!\n');
    } else if (token && user) {
      console.log('\n⚠️  토큰은 저장되었으나 리다이렉트되지 않음');
      console.log(`   현재 페이지: ${currentUrl}\n`);
    } else {
      console.log('\n❌ 실패: 로그인이 완료되지 않음');
      
      // 에러 메시지 확인
      const errorElement = page.locator('.text-destructive').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`   에러 메시지: ${errorText}\n`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 브라우저 종료\n');
  }
})();
