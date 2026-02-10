// 최근 제출 목록 조회 (테스트용)

console.log('🔍 최근 숙제 제출 내역 조회 중...');

fetch('https://superplacestudy.pages.dev/api/homework/submissions')
.then(res => res.json())
.then(data => {
  console.log(`📊 총 ${data.submissions?.length || 0}개의 제출 내역`);
  
  if (data.submissions && data.submissions.length > 0) {
    // 최근 5개만 표시
    const recent = data.submissions.slice(0, 5);
    console.log('\n최근 제출 내역:');
    recent.forEach((sub, idx) => {
      console.log(`\n${idx + 1}. ID: ${sub.id}`);
      console.log(`   학생: ${sub.studentName || 'N/A'}`);
      console.log(`   상태: ${sub.status}`);
      console.log(`   제출 시간: ${sub.submittedAt}`);
      if (sub.score) {
        console.log(`   점수: ${sub.score}점`);
      }
    });
    
    // 채점 대기 중인 항목 찾기
    const pending = data.submissions.filter(s => s.status === 'pending');
    if (pending.length > 0) {
      console.log(`\n⏳ 채점 대기 중: ${pending.length}개`);
      console.log(`\n🎯 테스트할 ID: ${pending[0].id}`);
      console.log(`\n다음 명령어로 채점 테스트:`);
      console.log(`node test_grading.js ${pending[0].id}`);
    }
  } else {
    console.log('제출 내역이 없습니다.');
  }
})
.catch(err => {
  console.error('❌ 오류:', err.message);
});
