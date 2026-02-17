const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Students API') || 
        text.includes('DIRECTOR') || 
        text.includes('Loaded students') ||
        text.includes('academyId')) {
      console.log('🔍 BROWSER LOG:', text);
    }
  });
  
  // 네트워크 요청 캡처
  page.on('request', request => {
    if (request.url().includes('/api/students')) {
      console.log('\n📡 API REQUEST:', request.url());
      console.log('   Method:', request.method());
      const headers = request.headers();
      console.log('   Authorization:', headers['authorization'] ? 'Present' : 'Missing');
      if (headers['authorization']) {
        console.log('   Token (first 50 chars):', headers['authorization'].substring(0, 50) + '...');
      }
    }
  });
  
  // 응답 캡처
  page.on('response', async response => {
    if (response.url().includes('/api/students')) {
      console.log('\n📥 API RESPONSE:', response.url());
      console.log('   Status:', response.status());
      try {
        const data = await response.json();
        console.log('   Success:', data.success);
        console.log('   Student Count:', data.students?.length || data.count || 0);
        if (data.students && data.students.length > 0) {
          console.log('   First 3 students:');
          data.students.slice(0, 3).forEach(s => {
            console.log(`     - ${s.name} (${s.email}) - Academy: ${s.academyId || 'NULL'}`);
          });
          
          // 학원 ID 분석
          const academyIds = [...new Set(data.students.map(s => s.academyId).filter(id => id))];
          console.log('   Unique Academy IDs:', academyIds);
        }
        if (data.error || data.message) {
          console.log('   Error/Message:', data.error || data.message);
        }
      } catch (e) {
        console.log('   Could not parse response:', e.message);
      }
    }
  });

  try {
    console.log('🚀 Starting test...\n');
    
    // 1. 홈페이지 접속
    console.log('1️⃣ Loading homepage...');
    await page.goto('https://superplace-academy.pages.dev', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // 2. 로그인 페이지로 이동
    console.log('\n2️⃣ Navigating to login page...');
    await page.goto('https://superplace-academy.pages.dev/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    
    // 3. kohsunwoo1234@gmail.com으로 로그인 시도
    console.log('\n3️⃣ Attempting login with kohsunwoo1234@gmail.com...');
    
    // 이메일 입력
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.type('input[type="email"], input[name="email"]', 'kohsunwoo1234@gmail.com');
    
    // 비밀번호 입력 (일반적인 테스트 비밀번호 시도)
    await page.type('input[type="password"], input[name="password"]', 'password123');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    console.log('   Waiting for navigation...');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('   Current URL after login:', currentUrl);
    
    // localStorage 확인
    const tokenInfo = await page.evaluate(() => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          return {
            hasUser: true,
            hasToken: !!token,
            role: userData.role,
            academyId: userData.academyId,
            email: userData.email,
            tokenInUser: !!userData.token
          };
        } catch (e) {
          return { error: 'Failed to parse user data' };
        }
      }
      return { hasUser: false, hasToken: !!token };
    });
    
    console.log('\n📦 LocalStorage Info:', JSON.stringify(tokenInfo, null, 2));
    
    if (!tokenInfo.hasUser && !tokenInfo.hasToken) {
      console.log('\n❌ Login failed - no token found');
      console.log('   This could mean:');
      console.log('   1. Wrong password');
      console.log('   2. Login API error');
      console.log('   3. Account does not exist');
      await browser.close();
      return;
    }
    
    // 4. 학생 관리 페이지로 이동
    console.log('\n4️⃣ Navigating to students page...');
    await page.goto('https://superplace-academy.pages.dev/dashboard/students', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    console.log('\n✅ Test complete!');
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log('Check the API REQUEST and API RESPONSE logs above.');
    console.log('Key things to look for:');
    console.log('  - Was Authorization header sent?');
    console.log('  - How many students were returned?');
    console.log('  - What are the unique academy IDs?');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
