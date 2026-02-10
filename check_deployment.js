const https = require('https');

console.log('🔍 배포 버전 확인 중...\n');

// 1. 현재 Git 커밋 확인
const { execSync } = require('child_process');
const localCommit = execSync('git rev-parse HEAD').toString().trim().substring(0, 7);
console.log(`📋 로컬 최신 커밋: ${localCommit}`);

// 2. Cloudflare Pages 배포 확인
https.get('https://superplacestudy.pages.dev/api/homework/debug', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n✅ 배포 환경 확인:');
      console.log('  - Gemini API Key:', parsed.hasGeminiApiKey ? '설정됨' : '미설정');
      console.log('  - Database:', parsed.hasDatabase ? '연결됨' : '미연결');
      console.log('  - 타임스탬프:', parsed.timestamp);
      
      console.log('\n🚀 배포 상태:');
      console.log('  - 로컬 커밋:', localCommit);
      console.log('  - 예상 배포 시간: 약 5-7분');
      console.log('  - 확인 방법: https://dash.cloudflare.com → Workers & Pages → superplace');
    } catch (e) {
      console.error('❌ 응답 파싱 실패:', e.message);
    }
  });
}).on('error', err => {
  console.error('❌ 요청 실패:', err.message);
});
