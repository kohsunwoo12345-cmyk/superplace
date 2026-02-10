// 상세 로깅이 포함된 AI 채점 테스트

const submissionId = 'homework-1770721533929-jvhu9b8rh';

console.log('🔍 채점 요청 시작...');
console.log(`   Submission ID: ${submissionId}`);
console.log(`   API Endpoint: /api/homework/process-grading`);
console.log(`   Timeout: 2분\n`);

const startTime = Date.now();

fetch('https://superplacestudy.pages.dev/api/homework/process-grading', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ submissionId }),
  signal: AbortSignal.timeout(120000) // 2분 타임아웃
})
.then(res => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`📡 응답 수신 (${elapsed}초 소요)`);
  console.log(`   상태 코드: ${res.status}`);
  console.log(`   상태 텍스트: ${res.statusText}\n`);
  return res.json();
})
.then(data => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('='.repeat(80));
  console.log(`✅ 채점 완료! (총 ${elapsed}초 소요)\n`);
  
  if (data.success) {
    console.log('📊 채점 결과:');
    console.log(`   - 성공: ${data.success}`);
    console.log(`   - 메시지: ${data.message}`);
    
    if (data.grading) {
      console.log('\n   채점 정보:');
      console.log(`   - ID: ${data.grading.id}`);
      console.log(`   - 점수: ${data.grading.score}점`);
      console.log(`   - 과목: ${data.grading.subject || 'N/A'}`);
    }
  } else {
    console.log('❌ 채점 실패:');
    console.log(`   - 에러: ${data.error}`);
    console.log(`   - 메시지: ${data.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n전체 응답:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.error(`\n❌ 오류 발생 (${elapsed}초 후):`);
  console.error(`   타입: ${err.name}`);
  console.error(`   메시지: ${err.message}`);
  
  if (err.name === 'TimeoutError') {
    console.error('\n   💡 타임아웃: Gemini API 응답이 2분 이상 소요되었습니다.');
    console.error('   이는 정상일 수 있습니다. 이미지 분석에 시간이 걸립니다.');
    console.error('\n   다음 명령어로 결과 확인:');
    console.error('   node check_submissions_v2.js');
  }
});
