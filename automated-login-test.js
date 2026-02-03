const https = require('https');

const tests = [
  {
    name: '✅ 관리자 로그인',
    email: 'admin@superplace.co.kr',
    password: 'admin1234!',
    shouldSucceed: true
  },
  {
    name: '✅ 일반 사용자 로그인',
    email: 'test3@test.com',
    password: 'test123',
    shouldSucceed: true
  },
  {
    name: '❌ 잘못된 비밀번호',
    email: 'admin@superplace.co.kr',
    password: 'wrongpassword',
    shouldSucceed: false
  },
  {
    name: '❌ 존재하지 않는 계정',
    email: 'nonexistent@test.com',
    password: 'test123',
    shouldSucceed: false
  }
];

function testLogin(test) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: test.email,
      password: test.password
    });

    const options = {
      hostname: 'genspark-ai-developer.superplacestudy.pages.dev',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            test,
            statusCode: res.statusCode,
            result
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runAllTests() {
  console.log('\n🔐 로그인 API 최종 테스트\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const { statusCode, result } = await testLogin(test);
      const success = result.success === test.shouldSucceed;
      
      if (success) {
        passed++;
        console.log(`\n✅ PASS: ${test.name}`);
        console.log(`   이메일: ${test.email}`);
        console.log(`   상태: ${result.success ? '성공' : '실패'} (예상대로)`);
        if (result.data && result.data.user) {
          console.log(`   사용자: ${result.data.user.name} (${result.data.user.role})`);
          console.log(`   토큰: ${result.data.token ? '생성됨 ✓' : '없음 ✗'}`);
        }
      } else {
        failed++;
        console.log(`\n❌ FAIL: ${test.name}`);
        console.log(`   예상: ${test.shouldSucceed ? '성공' : '실패'}`);
        console.log(`   실제: ${result.success ? '성공' : '실패'}`);
        console.log(`   메시지: ${result.message}`);
      }
    } catch (error) {
      failed++;
      console.log(`\n❌ ERROR: ${test.name}`);
      console.log(`   에러: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 테스트 결과: ${passed}/${tests.length} 통과`);
  
  if (failed === 0) {
    console.log('\n🎉 모든 테스트 통과! 로그인 시스템이 정상 작동합니다.\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed}개 테스트 실패\n`);
    process.exit(1);
  }
}

runAllTests().catch(console.error);
