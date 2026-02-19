const https = require('https');

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function checkDifference() {
  console.log('🔍 프로덕션 vs 프리뷰 비교 테스트\n');
  
  const testData = {
    email: 'admin@superplace.com',
    password: 'admin1234'
  };
  
  // 프로덕션 테스트
  console.log('📍 프로덕션: https://superplacestudy.pages.dev/api/auth/login');
  try {
    const prodResult = await makeRequest('https://superplacestudy.pages.dev/api/auth/login', testData);
    console.log('  Status:', prodResult.status);
    console.log('  Body:', prodResult.body.substring(0, 200));
    console.log('  Headers:', JSON.stringify(prodResult.headers, null, 2).substring(0, 300));
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }
  
  console.log('\n📍 프리뷰: https://791810fd.superplacestudy.pages.dev/api/auth/login');
  try {
    const previewResult = await makeRequest('https://791810fd.superplacestudy.pages.dev/api/auth/login', testData);
    console.log('  Status:', previewResult.status);
    console.log('  Body:', previewResult.body.substring(0, 200));
    console.log('  Headers:', JSON.stringify(previewResult.headers, null, 2).substring(0, 300));
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }
  
  // functions/ 디렉토리 확인
  console.log('\n📂 로컬 빌드 확인:');
  const fs = require('fs');
  
  if (fs.existsSync('functions/api/auth/login.ts')) {
    console.log('  ✅ functions/api/auth/login.ts 존재');
  } else {
    console.log('  ❌ functions/api/auth/login.ts 없음');
  }
  
  if (fs.existsSync('src/app/api/auth/login/route.ts')) {
    console.log('  ✅ src/app/api/auth/login/route.ts 존재');
    const content = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');
    if (content.includes('export const runtime')) {
      console.log('  ✅ Edge Runtime 설정 있음');
    } else {
      console.log('  ❌ Edge Runtime 설정 없음');
    }
    if (content.includes('import crypto from')) {
      console.log('  ❌ Node.js crypto import 발견 (문제!)');
    } else {
      console.log('  ✅ Web Crypto API 사용 중');
    }
  }
}

checkDifference().catch(console.error);
