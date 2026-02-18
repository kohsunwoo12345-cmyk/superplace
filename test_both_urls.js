// 두 배포 URL 비교 테스트
const https = require('https');

async function testAPI(hostname, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: hostname,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔍 프로덕션 vs 프리뷰 배포 비교 테스트\n');
  
  const testData = {
    email: 'admin@superplace.com',
    password: 'admin1234'
  };
  
  const urls = [
    { name: '프리뷰 (작동함)', hostname: 'd8533809.superplacestudy.pages.dev' },
    { name: '프로덕션 (문제)', hostname: 'superplacestudy.pages.dev' }
  ];
  
  const paths = [
    '/api/auth/login',
    '/api/login'
  ];
  
  for (const url of urls) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${url.name}: ${url.hostname}`);
    console.log('='.repeat(60));
    
    for (const path of paths) {
      try {
        console.log(`\n테스트: ${path}`);
        const result = await testAPI(url.hostname, path, testData);
        console.log(`  상태: ${result.status}`);
        if (typeof result.data === 'string') {
          console.log(`  응답: ${result.data.substring(0, 150)}`);
        } else {
          console.log(`  응답:`, JSON.stringify(result.data, null, 2).substring(0, 200));
        }
      } catch (error) {
        console.log(`  에러: ${error.message}`);
      }
    }
  }
  
  // 회원가입도 테스트
  console.log('\n\n' + '='.repeat(60));
  console.log('📝 회원가입 테스트');
  console.log('='.repeat(60));
  
  const signupData = {
    email: `test_${Date.now()}@example.com`,
    password: 'test12345678',
    name: '테스트사용자',
    role: 'DIRECTOR',
    academyName: '테스트 학원'
  };
  
  for (const url of urls) {
    console.log(`\n${url.name} - /api/auth/signup`);
    try {
      const result = await testAPI(url.hostname, '/api/auth/signup', signupData);
      console.log(`  상태: ${result.status}`);
      console.log(`  성공: ${result.data.success ? '✅' : '❌'}`);
      if (result.data.message) {
        console.log(`  메시지: ${result.data.message}`);
      }
    } catch (error) {
      console.log(`  에러: ${error.message}`);
    }
  }
}

runTests().catch(console.error);
