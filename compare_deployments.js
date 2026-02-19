// 프리뷰 vs 프로덕션 상세 비교
const https = require('https');

async function testAPI(hostname, path, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: hostname,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': postData.length })
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: parsed 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: body 
          });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runComparison() {
  console.log('🔍 프리뷰 vs 프로덕션 상세 비교\n');
  console.log('='.repeat(70));
  
  const deployments = [
    { name: '프리뷰 (작동함)', hostname: 'd8533809.superplacestudy.pages.dev' },
    { name: '프로덕션 (문제)', hostname: 'superplacestudy.pages.dev' }
  ];
  
  const testData = {
    email: 'admin@superplace.com',
    password: 'admin1234'
  };
  
  // 1. 로그인 API 경로 테스트
  console.log('\n📍 1. 로그인 API 경로 테스트\n');
  
  const loginPaths = [
    '/api/auth/login',
    '/api/login'
  ];
  
  for (const deployment of deployments) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🌐 ${deployment.name}: ${deployment.hostname}`);
    console.log('='.repeat(70));
    
    for (const path of loginPaths) {
      try {
        console.log(`\n테스트: ${path}`);
        const result = await testAPI(deployment.hostname, path, testData);
        console.log(`  상태: ${result.status}`);
        console.log(`  Location: ${result.headers.location || 'N/A'}`);
        console.log(`  Content-Type: ${result.headers['content-type'] || 'N/A'}`);
        
        if (result.status === 308 || result.status === 301 || result.status === 302) {
          console.log(`  ⚠️  리다이렉트 감지!`);
          console.log(`  → ${result.headers.location}`);
        }
        
        if (typeof result.data === 'string') {
          console.log(`  응답: ${result.data.substring(0, 100)}`);
        } else {
          console.log(`  성공: ${result.data.success ? '✅' : '❌'}`);
          console.log(`  메시지: ${result.data.message || result.data.error || 'N/A'}`);
        }
      } catch (error) {
        console.log(`  에러: ${error.message}`);
      }
    }
  }
  
  // 2. 회원가입 API 테스트
  console.log('\n\n📍 2. 회원가입 API 테스트\n');
  
  const signupData = {
    email: `test_${Date.now()}@example.com`,
    password: 'test12345678',
    name: '테스트사용자',
    role: 'DIRECTOR',
    academyName: '테스트 학원'
  };
  
  for (const deployment of deployments) {
    console.log(`\n${deployment.name}:`);
    try {
      const result = await testAPI(deployment.hostname, '/api/auth/signup', signupData);
      console.log(`  상태: ${result.status}`);
      console.log(`  Location: ${result.headers.location || 'N/A'}`);
      if (result.data.success !== undefined) {
        console.log(`  성공: ${result.data.success ? '✅' : '❌'}`);
        console.log(`  메시지: ${result.data.message}`);
      }
    } catch (error) {
      console.log(`  에러: ${error.message}`);
    }
  }
  
  // 3. 정적 리소스 테스트
  console.log('\n\n📍 3. 정적 리소스 테스트\n');
  
  for (const deployment of deployments) {
    console.log(`\n${deployment.name}:`);
    try {
      const result = await testAPI(deployment.hostname, '/login', null, 'GET');
      console.log(`  상태: ${result.status}`);
      console.log(`  Location: ${result.headers.location || 'N/A'}`);
      console.log(`  Content-Type: ${result.headers['content-type'] || 'N/A'}`);
    } catch (error) {
      console.log(`  에러: ${error.message}`);
    }
  }
  
  // 4. Functions 디렉토리 확인
  console.log('\n\n📍 4. Cloudflare Functions 파일 확인\n');
  
  for (const deployment of deployments) {
    console.log(`\n${deployment.name}:`);
    try {
      const result = await testAPI(deployment.hostname, '/_functions', null, 'GET');
      console.log(`  상태: ${result.status}`);
      console.log(`  응답 타입: ${typeof result.data}`);
    } catch (error) {
      console.log(`  에러: ${error.message}`);
    }
  }
  
  console.log('\n\n' + '='.repeat(70));
  console.log('테스트 완료');
  console.log('='.repeat(70));
}

runComparison().catch(console.error);
