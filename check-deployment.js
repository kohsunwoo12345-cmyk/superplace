#!/usr/bin/env node
/**
 * Vercel 배포 상태 및 API 엔드포인트 확인
 */

const https = require('https');

const urls = [
  'https://superplace-study.vercel.app',
  'https://superplace-study.vercel.app/api/health',
  'https://superplace-study.vercel.app/api/auth/session',
  'https://superplace-study.vercel.app/api/admin/users',
  'https://superplace-study.vercel.app/auth/signin',
];

console.log('🔍 Vercel 배포 상태 확인\n');
console.log('=' .repeat(60));

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 200)
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({ error: err.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });
  });
}

async function main() {
  for (const url of urls) {
    console.log(`\n📍 ${url}`);
    const result = await checkUrl(url);
    
    if (result.error) {
      console.log(`   ❌ 에러: ${result.error}`);
    } else {
      const statusEmoji = result.status === 200 ? '✅' : 
                         result.status === 401 || result.status === 403 ? '🔒' :
                         result.status >= 500 ? '❌' : '⚠️';
      console.log(`   ${statusEmoji} 상태: ${result.status}`);
      
      if (result.body) {
        const preview = result.body.replace(/\n/g, ' ').substring(0, 100);
        console.log(`   📄 응답: ${preview}${result.body.length > 100 ? '...' : ''}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ 확인 완료');
  console.log('\n다음 단계:');
  console.log('1. DATABASE_URL 환경 변수 확인 (Vercel 대시보드)');
  console.log('2. node run-fix.js 실행하여 SUPER_ADMIN 생성');
  console.log('3. Vercel 배포 로그 확인');
}

main();
