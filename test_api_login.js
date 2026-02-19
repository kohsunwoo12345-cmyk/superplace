// 실제 로그인 API 테스트
const https = require('https');

const API_URL = 'https://superplace-academy.pages.dev/api/auth/login';

async function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(API_URL, options, (res) => {
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

async function testSignup(email, password, name, role) {
  const SIGNUP_URL = 'https://superplace-academy.pages.dev/api/auth/signup';
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ 
      email, 
      password, 
      name, 
      role,
      academyName: role === 'DIRECTOR' ? '테스트 학원' : undefined
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(SIGNUP_URL, options, (res) => {
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

async function runTests() {
  console.log('🧪 실제 API 테스트 시작...\n');
  
  // 1. 관리자 계정 테스트
  console.log('1️⃣ 관리자 계정 테스트 (admin@superplace.co.kr)');
  console.log('═══════════════════════════════════════════════');
  
  const passwords = ['admin1234', 'admin123', '1234', 'password'];
  for (const pwd of passwords) {
    try {
      const result = await testLogin('admin@superplace.co.kr', pwd);
      console.log(`비밀번호 "${pwd}": [${result.status}]`);
      console.log('응답:', JSON.stringify(result.data, null, 2));
      if (result.data.success) {
        console.log('✅ 로그인 성공!\n');
        break;
      }
    } catch (error) {
      console.log(`에러: ${error.message}`);
    }
  }
  
  // 2. 새 사용자 회원가입 테스트
  console.log('\n2️⃣ 회원가입 테스트');
  console.log('═══════════════════════════════════════════════');
  const testEmail = `test_${Date.now()}@example.com`;
  try {
    const result = await testSignup(testEmail, 'test12345678', '테스트사용자', 'DIRECTOR');
    console.log(`상태: [${result.status}]`);
    console.log('응답:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log(`에러: ${error.message}`);
  }
  
  // 3. 테스트 계정들 시도
  console.log('\n3️⃣ 테스트 계정 로그인 시도');
  console.log('═══════════════════════════════════════════════');
  const testAccounts = [
    { email: 'admin@superplace.com', password: 'admin1234' },
    { email: 'director@superplace.com', password: 'director1234' },
    { email: 'test@test.com', password: 'test1234' }
  ];
  
  for (const account of testAccounts) {
    try {
      const result = await testLogin(account.email, account.password);
      console.log(`${account.email}: [${result.status}] ${result.data.success ? '✅' : '❌'} ${result.data.message}`);
    } catch (error) {
      console.log(`${account.email}: 에러 - ${error.message}`);
    }
  }
}

runTests().catch(console.error);
