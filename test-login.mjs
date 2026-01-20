import { chromium } from 'playwright';

async function testLogin() {
  console.log('🚀 로그인 테스트 시작\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 1. 로그인 페이지 접속
    console.log('📍 Step 1: 로그인 페이지 접속');
    const loginUrl = 'https://3011-iftozwzhzim0qta6v3gft-b237eb32.sandbox.novita.ai/auth/signin';
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    console.log('   ✅ 페이지 로드 완료\n');
    
    // 2. 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 3. 로그인 폼 확인
    console.log('\n📍 Step 2: 로그인 폼 확인');
    const emailInput = await page.locator('input[name="email"]');
    const passwordInput = await page.locator('input[name="password"]');
    const submitButton = await page.locator('button[type="submit"]');
    
    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const buttonExists = await submitButton.count() > 0;
    
    console.log('   📧 이메일 입력 필드:', emailExists ? '✅ 존재' : '❌ 없음');
    console.log('   🔑 비밀번호 입력 필드:', passwordExists ? '✅ 존재' : '❌ 없음');
    console.log('   🔘 로그인 버튼:', buttonExists ? '✅ 존재' : '❌ 없음');
    
    if (!emailExists || !passwordExists || !buttonExists) {
      throw new Error('로그인 폼을 찾을 수 없습니다.');
    }
    
    // 4. 관리자 정보 입력
    console.log('\n📍 Step 3: 관리자 정보 입력');
    console.log('   📧 이메일: admin@superplace.com');
    console.log('   🔑 비밀번호: admin123!@#');
    
    await emailInput.fill('admin@superplace.com');
    await passwordInput.fill('admin123!@#');
    console.log('   ✅ 정보 입력 완료\n');
    
    // 5. 로그인 버튼 클릭
    console.log('📍 Step 4: 로그인 시도');
    await submitButton.click();
    
    // 네비게이션 대기 (최대 10초)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // 6. 결과 확인
    const currentUrl = page.url();
    console.log('   🔗 현재 URL:', currentUrl);
    
    // 에러 메시지 확인
    const errorElement = page.locator('.bg-destructive\\/10, [role="alert"]');
    const hasError = await errorElement.count() > 0;
    
    if (hasError) {
      const errorText = await errorElement.first().textContent();
      console.log('   ❌ 에러 발생:', errorText?.trim());
      await page.screenshot({ path: '/home/user/webapp/login-error.png', fullPage: true });
      console.log('   📸 스크린샷 저장: login-error.png');
    }
    
    // 7. 성공 여부 판단
    console.log('\n📍 Step 5: 결과 확인');
    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ 로그인 성공!');
      console.log('   ✅ 대시보드로 이동 완료');
      
      // 대시보드 제목 확인
      const dashboardTitle = await page.title();
      console.log('   📄 대시보드 제목:', dashboardTitle);
      
      // 사용자 정보 확인
      const userNameElement = page.locator('text=/System Administrator|관리자|SUPER_ADMIN/i').first();
      const userName = await userNameElement.textContent().catch(() => null);
      if (userName) {
        console.log('   👤 사용자 정보:', userName.trim());
      }
      
      await page.screenshot({ path: '/home/user/webapp/login-success.png', fullPage: true });
      console.log('   📸 스크린샷 저장: login-success.png\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 테스트 성공!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('✅ 로그인 작동 확인');
      console.log('✅ 관리자 계정 정상');
      console.log('✅ 대시보드 접근 가능\n');
      
      return true;
    } else {
      console.log('   ❌ 로그인 실패');
      console.log('   ❌ 페이지가 이동하지 않았습니다.');
      console.log('   🔗 예상 URL: /dashboard');
      console.log('   🔗 실제 URL:', currentUrl);
      
      await page.screenshot({ path: '/home/user/webapp/login-failed.png', fullPage: true });
      console.log('   📸 스크린샷 저장: login-failed.png\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ 테스트 실패');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    await page.screenshot({ path: '/home/user/webapp/login-exception.png', fullPage: true });
    console.log('📸 예외 스크린샷 저장: login-exception.png\n');
    return false;
  } finally {
    await browser.close();
  }
}

testLogin().then(success => {
  process.exit(success ? 0 : 1);
});
