const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Console 로그 캡처
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });

  // 네트워크 요청 캡처
  page.on('request', request => {
    if (request.url().includes('/api/admin/landing-pages')) {
      console.log(`\n📤 [API REQUEST] ${request.method()} ${request.url()}`);
      if (request.postDataJSON()) {
        const data = request.postDataJSON();
        console.log(`   templateType: ${data.templateType}`);
        console.log(`   templateHtmlLength: ${data.templateHtml?.length || 0}`);
        console.log(`   hasTemplateHtml: ${!!data.templateHtml}`);
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/admin/landing-pages')) {
      console.log(`\n📥 [API RESPONSE] ${response.status()} ${response.url()}`);
      try {
        const body = await response.json();
        console.log(`   Response:`, JSON.stringify(body, null, 2));
      } catch (e) {
        console.log(`   (Could not parse response)`);
      }
    }
  });

  try {
    console.log('🌐 Opening builder page...');
    await page.goto('https://superplacestudy.pages.dev/dashboard/admin/landing-pages/builder', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // 로그인 여부 확인
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('❌ Not logged in. Need to login first.');
      await browser.close();
      return;
    }

    // 페이지 로드 완료 대기
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // 제목 입력
    console.log('✏️ Entering title...');
    await page.fill('input[placeholder*="제목"]', '실제 브라우저 테스트 - 김민수 학생');

    // 학생 리포트 템플릿 클릭
    console.log('🎯 Clicking 학생 리포트 template button...');
    await page.waitForTimeout(1000);
    
    // 템플릿 버튼 찾기
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.includes('학생 리포트')) {
        console.log(`   Found button: "${text}"`);
        await button.click();
        console.log('   ✅ Button clicked!');
        break;
      }
    }

    // 클릭 후 잠시 대기 (상태 업데이트 시간)
    await page.waitForTimeout(2000);

    // 저장 버튼 클릭
    console.log('💾 Clicking save button...');
    const saveButtons = await page.locator('button').all();
    for (const button of saveButtons) {
      const text = await button.textContent();
      if (text && (text.includes('저장') || text.includes('생성'))) {
        console.log(`   Found save button: "${text}"`);
        await button.click();
        console.log('   ✅ Save button clicked!');
        break;
      }
    }

    // API 응답 대기
    console.log('⏳ Waiting for API response...');
    await page.waitForTimeout(5000);

    // Alert 체크
    page.on('dialog', async dialog => {
      console.log(`\n🚨 [ALERT] ${dialog.message()}`);
      await dialog.accept();
    });

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
})();
