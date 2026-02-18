// 올바른 API 경로로 테스트
const https = require('https');

// Cloudflare Pages Functions는 /api/auth/login이 아니라
// Functions 디렉토리 구조에 따라 다를 수 있음

async function testAPI(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
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
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔍 API 경로 테스트 중...\n');
  
  const baseURL = 'https://superplace-academy.pages.dev';
  const testData = { email: 'admin@superplace.co.kr', password: 'test1234' };
  
  const paths = [
    '/api/auth/login',
    '/auth/login', 
    '/functions/api/auth/login',
    '/api/login'
  ];
  
  for (const path of paths) {
    try {
      console.log(`테스트: ${baseURL}${path}`);
      const result = await testAPI(baseURL + path, testData);
      console.log(`  상태: ${result.status}`);
      console.log(`  응답:`, typeof result.data === 'string' ? result.data.substring(0, 100) : JSON.stringify(result.data).substring(0, 100));
      console.log('');
    } catch (error) {
      console.log(`  에러: ${error.message}\n`);
    }
  }
}

runTests().catch(console.error);
