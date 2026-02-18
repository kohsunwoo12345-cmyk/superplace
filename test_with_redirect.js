const https = require('https');

const testLogin = (path) => {
  console.log(`\n=== ${path} 테스트 ===\n`);
  
  const loginData = JSON.stringify({
    email: 'admin@superplace.com',
    password: 'admin1234'
  });

  const options = {
    hostname: 'superplacestudy.pages.dev',
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`상태 코드: ${res.statusCode}`);
      
      if (res.statusCode === 308 || res.statusCode === 301) {
        console.log(`리다이렉트 위치: ${res.headers.location}`);
        resolve({ redirect: res.headers.location });
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n응답:');
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (e) {
          console.log('원본 응답:', data);
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
  // 두 가지 경로 모두 테스트
  await testLogin('/api/auth/login');
  await testLogin('/api/auth/login/');
})();
