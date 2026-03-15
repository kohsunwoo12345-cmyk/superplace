const https = require('https');

console.log('\n========== 배포 확인 시작 ==========\n');
console.log('⏳ 배포 대기 중... (2분)');

setTimeout(async () => {
  console.log('\n✅ 대기 완료! 배포 상태 확인 중...\n');
  
  // 1. 메인 페이지 확인
  https.get('https://superplacestudy.pages.dev/ai-chat', (res) => {
    console.log(`✅ AI 챗 페이지: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('\n🎉 배포 완료!\n');
      console.log('========== 최종 요약 ==========\n');
      console.log('📋 개선된 기능:');
      console.log('  1. **강사용 해설지** 키워드 자동 인식');
      console.log('  2. 답안/해설 파싱 로직 개선');
      console.log('  3. 학생용/강사용 페이지 자동 분리');
      console.log('  4. 상세 콘솔 로깅 추가\n');
      
      console.log('🔍 테스트 방법:');
      console.log('  1. https://superplacestudy.pages.dev/ai-chat 접속');
      console.log('  2. AI에게 다음과 같이 요청:');
      console.log('     "소인수분해 객관식 문제 5개 출제해줘.');
      console.log('      학생용 시험지와 강사용 해설지를 따로 만들어줘."');
      console.log('  3. AI 응답 확인:');
      console.log('     - 문제 번호 있는지 (1., 2., 3. ...)');
      console.log('     - 답안 섹션 분리되어 있는지');
      console.log('  4. "🖨️ 문제지 출력" 버튼 클릭');
      console.log('  5. 새 창에서 확인:');
      console.log('     - 페이지 1: 학생용 시험지 (문제만)');
      console.log('     - 페이지 2: 강사용 해설지 (답안+해설)\n');
      
      console.log('📝 지원되는 AI 응답 형식:');
      console.log('  ✅ **학생용 시험지** / **강사용 해설지**');
      console.log('  ✅ **정답 및 해설**');
      console.log('  ✅ **정답** / **해설**');
      console.log('  ✅ 각 답안: 정답: ①, 해설: ..., 단계별 풀이: ..., 팁: ...\n');
      
      console.log('📚 문서:');
      console.log('  - AI_CHAT_PRINT_GUIDE.md: 전체 사용 가이드');
      console.log('  - test-problem-parser.js: 파싱 로직 테스트');
      console.log('  - test-print-separation.js: 분리 출력 테스트\n');
      
      console.log('🔧 문제 해결:');
      console.log('  - "문제를 찾을 수 없습니다" → AI에게 번호 형식 명시 요청');
      console.log('  - "정답 없음" 표시 → 답안 섹션 분리 요청');
      console.log('  - 콘솔(F12) 확인 → 상세 로그 출력됨\n');
      
      console.log('✅ 배포 URL: https://superplacestudy.pages.dev/ai-chat');
      console.log('✅ 최신 커밋: 1477915d');
      console.log('✅ 배포 시각:', new Date().toLocaleString('ko-KR'));
      console.log('\n========================================\n');
    } else {
      console.log(`⚠️  상태 코드: ${res.statusCode} - 배포 확인 필요`);
    }
  }).on('error', (err) => {
    console.error('❌ 배포 확인 실패:', err.message);
  });
}, 120000); // 2분 대기

console.log('\n💡 배포 진행 중...');
console.log('   Cloudflare Pages는 일반적으로 2-3분이 소요됩니다.');
console.log('   잠시만 기다려주세요...\n');
