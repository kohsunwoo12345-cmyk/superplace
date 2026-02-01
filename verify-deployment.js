#!/usr/bin/env node
const https = require('https');

console.log('🔍 Vercel 배포 확인 중...\n');

// API 엔드포인트 확인
https.get('https://superplace-study.vercel.app/api/admin/users', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('API 상태:', res.statusCode);
    console.log('응답:', data.substring(0, 200));
    
    if (res.statusCode === 403) {
      console.log('\n❌ 아직 403 에러입니다.');
      console.log('배포가 완료되지 않았거나 코드가 반영되지 않았습니다.\n');
    } else if (res.statusCode === 401) {
      console.log('\n⚠️  401 - 로그인 필요 (정상)');
      console.log('코드 변경이 반영되었습니다!');
    } else if (res.statusCode === 200) {
      console.log('\n✅ 200 - 정상 응답!');
    }
  });
}).on('error', (err) => {
  console.error('에러:', err.message);
});

// 배포 버전 확인
https.get('https://superplace-study.vercel.app/', (res) => {
  const deploymentId = res.headers['x-vercel-id'];
  const cacheStatus = res.headers['x-vercel-cache'];
  console.log('\n배포 정보:');
  console.log('Deployment ID:', deploymentId);
  console.log('Cache Status:', cacheStatus);
});
