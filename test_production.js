const https = require('https');

async function testLogin(email, password) {
  console.log(`\n=== 테스트: ${email} ===`);
  
  const data = JSON.stringify({ email, password });
  
  const options = {
    hostname: 'superplacestudy.pages.dev',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', chunk => body += chunk);
      
      res.on('end', () => {
        console.log(`상태 코드: ${res.statusCode}`);
        
        if (res.statusCode === 308 || res.statusCode === 301) {
          console.log(`리다이렉트: ${res.headers.location}`);
          resolve({ redirect: true });
          return;
        }
        
        try {
          const json = JSON.parse(body);
          console.log('응답:', JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.log('원본 응답:', body.substring(0, 200));
          resolve({ error: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testAll() {
  console.log('====================================');
  console.log('프로덕션 로그인 API 테스트');
  console.log('URL: https://superplacestudy.pages.dev');
  console.log('====================================');

  const accounts = [
    { email: 'admin@superplace.com', password: 'admin1234' },
    { email: 'director@superplace.com', password: 'director1234' },
    { email: 'teacher@superplace.com', password: 'teacher1234' },
    { email: 'test@test.com', password: 'test1234' },
    { email: 'wrong@test.com', password: 'wrongpass' }
  ];

  for (const acc of accounts) {
    await testLogin(acc.email, acc.password);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n====================================');
  console.log('테스트 완료');
  console.log('====================================');
}

testAll().catch(console.error);
