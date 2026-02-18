const https = require('https');

// 실제 배포된 API 엔드포인트 테스트
const testLogin = async () => {
  console.log('\n=== 배포된 로그인 API 테스트 ===\n');
  
  const loginData = JSON.stringify({
    email: 'admin@superplace.com',
    password: 'admin1234'
  });

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
      console.log(`응답 헤더:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n응답 본문:');
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (e) {
          console.log('JSON 파싱 실패:', data.substring(0, 500));
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

testLogin().catch(err => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
