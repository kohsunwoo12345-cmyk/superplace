#!/usr/bin/env node
/**
 * 프로덕션 배포 후 API 상태 확인 스크립트
 * 
 * 사용법:
 *   node verify_production.js
 * 
 * 확인 항목:
 * 1. API 엔드포인트 상태 (200 OK 예상)
 * 2. 로그인 API 작동 여부
 * 3. 회원가입 API 작동 여부
 */

const https = require('https');

const PRODUCTION_URL = 'superplacestudy.pages.dev';
const TEST_ACCOUNTS = [
  { email: 'admin@superplace.com', password: 'admin1234', name: 'SUPER_ADMIN' },
  { email: 'director@superplace.com', password: 'director1234', name: 'DIRECTOR' },
  { email: 'admin@superplace.co.kr', password: 'admin1234', name: 'EXISTING_ADMIN' },
];

function httpRequest(hostname, path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkEndpoint(path, method = 'GET', data = null) {
  console.log(`\n🔍 Testing: ${method} https://${PRODUCTION_URL}${path}`);
  
  try {
    const response = await httpRequest(PRODUCTION_URL, path, method, data);
    const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    const isRedirect = response.statusCode >= 300 && response.statusCode < 400;
    
    if (isRedirect) {
      console.log(`❌ REDIRECT: ${response.statusCode} → ${response.headers.location || 'Unknown'}`);
      return false;
    }
    
    if (isSuccess) {
      console.log(`✅ SUCCESS: ${response.statusCode}`);
      if (response.body) {
        try {
          const json = JSON.parse(response.body);
          console.log(`   Response:`, JSON.stringify(json, null, 2).slice(0, 200));
        } catch (e) {
          console.log(`   Response:`, response.body.slice(0, 100));
        }
      }
      return true;
    }
    
    console.log(`⚠️  ERROR: ${response.statusCode}`);
    console.log(`   Response:`, response.body.slice(0, 200));
    return false;
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  }
}

async function testLogin(account) {
  console.log(`\n🧪 Testing login: ${account.name} (${account.email})`);
  
  const loginData = {
    email: account.email,
    password: account.password,
  };
  
  const response = await httpRequest(PRODUCTION_URL, '/api/auth/login', 'POST', loginData);
  
  if (response.statusCode === 308) {
    console.log(`❌ REDIRECT: 308 → ${response.headers.location}`);
    console.log(`   🔧 FIX NEEDED: trailingSlash 설정 확인`);
    return false;
  }
  
  if (response.statusCode === 200) {
    try {
      const json = JSON.parse(response.body);
      if (json.success) {
        console.log(`✅ LOGIN SUCCESS: ${account.name}`);
        console.log(`   User: ${json.user?.name || 'N/A'}`);
        console.log(`   Role: ${json.user?.role || 'N/A'}`);
        return true;
      }
    } catch (e) {
      // Not JSON
    }
  }
  
  if (response.statusCode === 401) {
    console.log(`⚠️  WRONG CREDENTIALS: ${account.email}`);
    console.log(`   Response:`, response.body);
    return false;
  }
  
  console.log(`❌ LOGIN FAILED: ${response.statusCode}`);
  console.log(`   Response:`, response.body.slice(0, 200));
  return false;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 프로덕션 배포 검증 스크립트');
  console.log('='.repeat(60));
  console.log(`📍 Target: https://${PRODUCTION_URL}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // 1. API 엔드포인트 상태 확인
  console.log('\n\n📋 STEP 1: API Endpoint Status Check');
  console.log('-'.repeat(60));
  
  const endpoints = [
    { path: '/api/auth/login', method: 'POST', data: {} },
    { path: '/api/auth/signup', method: 'POST', data: {} },
  ];
  
  const results = {
    endpoints: [],
    logins: [],
  };
  
  for (const endpoint of endpoints) {
    const success = await checkEndpoint(endpoint.path, endpoint.method, endpoint.data);
    results.endpoints.push({ path: endpoint.path, success });
  }

  // 2. 로그인 테스트
  console.log('\n\n📋 STEP 2: Login Tests');
  console.log('-'.repeat(60));
  
  for (const account of TEST_ACCOUNTS) {
    const success = await testLogin(account);
    results.logins.push({ account: account.name, success });
  }

  // 3. 결과 요약
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(60));
  
  const endpointSuccess = results.endpoints.filter(r => r.success).length;
  const endpointTotal = results.endpoints.length;
  console.log(`\n🔗 API Endpoints: ${endpointSuccess}/${endpointTotal} passed`);
  results.endpoints.forEach(r => {
    console.log(`   ${r.success ? '✅' : '❌'} ${r.path}`);
  });
  
  const loginSuccess = results.logins.filter(r => r.success).length;
  const loginTotal = results.logins.length;
  console.log(`\n👤 Login Tests: ${loginSuccess}/${loginTotal} passed`);
  results.logins.forEach(r => {
    console.log(`   ${r.success ? '✅' : '❌'} ${r.account}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  const allPassed = endpointSuccess === endpointTotal && loginSuccess > 0;
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED! 프로덕션 배포 성공!');
    console.log('\n📌 Next Steps:');
    console.log('   1. ✅ 브라우저에서 로그인 테스트');
    console.log('   2. ✅ 기존 사용자 계정 확인');
    console.log('   3. ✅ 회원가입 기능 테스트');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Cloudflare Pages 배포 상태 확인');
    console.log('   2. D1 데이터베이스 연결 확인');
    console.log('   3. Environment Variables 확인');
    console.log('   4. Cache 클리어 후 재시도');
  }
  
  console.log('\n💡 Manual Test:');
  console.log(`   https://${PRODUCTION_URL}/login/`);
  console.log('='.repeat(60));
}

main().catch(console.error);
