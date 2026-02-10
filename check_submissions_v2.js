// 최근 제출 내역 조회 (results API 사용)

console.log('🔍 최근 숙제 제출 내역 조회 중...\n');

// 관리자 권한으로 전체 조회
fetch('https://superplacestudy.pages.dev/api/homework/results?role=ADMIN&email=admin@superplace.co.kr')
.then(res => {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
})
.then(data => {
  if (!data.success) {
    console.error('❌ API 오류:', data.error);
    return;
  }
  
  console.log(`📊 총 ${data.submissions.length}개의 제출 내역\n`);
  console.log(`통계:`);
  console.log(`  - 총 제출: ${data.stats.totalSubmissions}개`);
  console.log(`  - 평균 점수: ${data.stats.averageScore.toFixed(1)}점`);
  console.log(`  - 오늘 제출: ${data.stats.todaySubmissions}개`);
  console.log(`  - 채점 대기: ${data.stats.pendingReview}개\n`);
  
  if (data.submissions.length > 0) {
    // 최근 10개만 표시
    const recent = data.submissions.slice(0, 10);
    console.log('최근 제출 내역 (최대 10개):');
    console.log('='.repeat(80));
    
    recent.forEach((sub, idx) => {
      console.log(`\n${idx + 1}. ID: ${sub.id}`);
      console.log(`   학생: ${sub.userName} (${sub.userEmail})`);
      console.log(`   제출: ${sub.submittedAt}`);
      console.log(`   이미지: ${sub.imageCount}장`);
      
      if (sub.score > 0) {
        console.log(`   ✅ 채점 완료: ${sub.score}점`);
        console.log(`   과목: ${sub.subject}`);
        console.log(`   정답: ${sub.correctAnswers}/${sub.totalQuestions}`);
        console.log(`   채점: ${sub.gradedAt}`);
      } else {
        console.log(`   ⏳ 채점 대기 중`);
      }
    });
    
    // 채점 대기 중인 항목 찾기
    const pending = data.submissions.filter(s => s.score === 0 || !s.gradedAt);
    if (pending.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log(`\n⏳ 채점 대기 중인 숙제: ${pending.length}개`);
      console.log(`\n🎯 테스트할 첫 번째 ID: ${pending[0].id}`);
      console.log(`   학생: ${pending[0].userName}`);
      console.log(`   제출: ${pending[0].submittedAt}`);
      console.log(`\n다음 명령어로 채점 테스트:`);
      console.log(`node test_grading.js ${pending[0].id}`);
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('\n✅ 모든 숙제가 채점 완료되었습니다!');
    }
  } else {
    console.log('제출 내역이 없습니다.');
  }
})
.catch(err => {
  console.error('❌ 오류:', err.message);
});
