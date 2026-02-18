// /api/login이 작동하므로 이 경로로 테스트
const https = require('https');

async function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'superplace-academy.pages.dev',
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
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
    req.write(data);
    req.end();
  });
}

async function testSignup(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'superplace-academy.pages.dev',
      path: '/api/signup',
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
  console.log('🧪 실제 작동하는 API로 테스트 시작...\n');
  
  // 1. 관리자 계정 테스트
  console.log('1️⃣ 관리자 계정 테스트 (admin@superplace.co.kr)');
  console.log('═══════════════════════════════════════════════');
  try {
    const result = await testLogin('admin@superplace.co.kr', 'admin1234');
    console.log(`상태: ${result.status}`);
    console.log('응답:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log(`에러: ${error.message}`);
  }
  
  // 2. 회원가입 테스트
  console.log('\n2️⃣ 새 사용자 회원가입 테스트');
  console.log('═══════════════════════════════════════════════');
  const testEmail = `test_${Date.now()}@example.com`;
  try {
    const result = await testSignup({
      email: testEmail,
      password: 'test12345678',
      name: '테스트사용자',
      role: 'DIRECTOR',
      academyName: '테스트 학원'
    });
    console.log(`상태: ${result.status}`);
    console.log('응답:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log(`에러: ${error.message}`);
  }
  
  // 3. 다양한 계정 테스트
  console.log('\n3️⃣ 다양한 계정으로 로그인 시도');
  console.log('═══════════════════════════════════════════════');
  const accounts = [
    'admin@superplace.co.kr',
    'admin@superplace.com',
    'director@superplace.com',
    'test@test.com'
  ];
  
  for (const email of accounts) {
    try {
      const result = await testLogin(email, 'admin1234');
      console.log(`${email}: [${result.status}] ${result.data.success ? '✅' : '❌'}`);
      if (!result.data.success) {
        console.log(`  메시지: ${result.data.error || result.data.message}`);
      }
    } catch (error) {
      console.log(`${email}: 에러 - ${error.message}`);
    }
  }
}

runTests().catch(console.error);
