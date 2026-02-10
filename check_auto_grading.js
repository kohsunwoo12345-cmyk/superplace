const https = require('https');

console.log('🔍 자동 채점 시스템 진단...\n');

// 1. 최신 제출 조회
https.get('https://superplacestudy.pages.dev/api/homework/results?role=ADMIN&email=admin@superplace.co.kr', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const submissions = parsed.submissions || [];
    
    // 최근 10개 제출 분석
    const recent = submissions.slice(0, 10);
    const pending = recent.filter(s => s.completion === 'pending' || s.score === 0);
    const graded = recent.filter(s => s.completion !== 'pending' && s.score > 0);
    
    console.log('📊 최근 10개 제출 분석:');
    console.log(`  - 총 제출: ${recent.length}개`);
    console.log(`  - 채점 완료: ${graded.length}개`);
    console.log(`  - 채점 대기: ${pending.length}개`);
    console.log('');
    
    if (pending.length > 0) {
      console.log('⚠️ 채점 대기 중인 제출:');
      pending.forEach((s, i) => {
        const timeSince = Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / 1000 / 60);
        console.log(`  ${i + 1}. ${s.id}`);
        console.log(`     학생: ${s.userName}`);
        console.log(`     제출: ${s.submittedAt} (${timeSince}분 전)`);
        console.log('');
      });
      
      console.log('🔧 문제 분석:');
      console.log('  1. 배포가 완료되지 않았을 수 있음');
      console.log('  2. 프론트엔드 코드가 업데이트되지 않았을 수 있음');
      console.log('  3. 브라우저 캐시가 오래된 코드를 로드했을 수 있음');
      console.log('');
      console.log('💡 해결 방법:');
      console.log('  1. Ctrl+Shift+R (강력 새로고침)으로 캐시 클리어');
      console.log('  2. 시크릿 모드에서 테스트');
      console.log('  3. 배포 완료 확인: https://dash.cloudflare.com');
      console.log('');
      console.log('🚀 임시 해결: 대기 중인 제출 수동 채점');
      pending.forEach(s => {
        console.log(`  node test_grading.js ${s.id}`);
      });
    } else {
      console.log('✅ 모든 제출이 정상적으로 채점되었습니다!');
    }
  });
}).on('error', err => {
  console.error('❌ 요청 실패:', err.message);
});
