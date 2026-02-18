const https = require('https');

const testAPI = (email, password) => {
  console.log(`\n=== 로그인 테스트: ${email} ===\n`);
  
  const loginData = JSON.stringify({ email, password });

  const options = {
    hostname: 'superplacestudy.pages.dev',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`상태 코드: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('응답:', JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (e) {
          console.log('원본 응답:', data.substring(0, 200));
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('요청 오류:', e);
      reject(e);
    });

    req.write(loginData);
    req.end();
  });
};

(async () => {
  // 여러 계정 테스트
  await testAPI('admin@superplace.com', 'admin123456');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await testAPI('teacher@superplace.com', 'teacher123');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await testAPI('wronguser@test.com', 'wrongpass');
})();
