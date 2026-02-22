const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('🌐 페이지 로딩 중...');
  await page.goto('https://3000-imchmplptuquofiyqcorq-8f57ffe2.sandbox.novita.ai/test-login', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  console.log('✅ 페이지 로드 완료');
  
  // 입력 필드 채우기
  console.log('📝 로그인 정보 입력 중...');
  await page.type('input[type="email"]', 'director@test.com');
  await page.type('input[type="password"]', 'director123');
  
  console.log('🖱️ 로그인 버튼 클릭...');
  
  // 콘솔 로그 수집
  page.on('console', msg => {
    console.log('🔍 [PAGE LOG]:', msg.text());
  });
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  
  // 결과 대기
  await page.waitForTimeout(5000);
  
  // localStorage 확인
  const localStorageData = await page.evaluate(() => {
    return {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
    };
  });
  
  console.log('\n📦 localStorage 데이터:');
  console.log('Token:', localStorageData.token ? '존재함 ✅' : '없음 ❌');
  console.log('User:', localStorageData.user ? '존재함 ✅' : '없음 ❌');
  
  if (localStorageData.user) {
    console.log('\n👤 사용자 정보:');
    console.log(JSON.parse(localStorageData.user));
  }
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('\n🔗 현재 URL:', currentUrl);
  
  // 스크린샷 저장
  await page.screenshot({ path: '/home/user/webapp/test-login-result.png', fullPage: true });
  console.log('\n📸 스크린샷 저장: /home/user/webapp/test-login-result.png');
  
  await browser.close();
  console.log('\n✅ 테스트 완료!');
})();
