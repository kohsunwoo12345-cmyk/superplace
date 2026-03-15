async function check() {
  console.log('배포 대기 (2분)...\n');
  await new Promise(r => setTimeout(r, 120000));
  
  console.log('=== 실제 데이터베이스 확인 ===\n');
  
  const res = await fetch('https://superplacestudy.pages.dev/api/debug/point-requests');
  const data = await res.json();
  
  console.log('요약:');
  console.log(`  총 요청: ${data.summary?.totalRequests || 0}개`);
  console.log(`  academyId NULL: ${data.summary?.nullAcademyIdCount || 0}개\n`);
  
  if (data.summary?.statusCounts) {
    console.log('상태별:');
    data.summary.statusCounts.forEach(s => {
      console.log(`  ${s.status}: ${s.count}개`);
    });
    console.log('');
  }
  
  if (data.recentRequests && data.recentRequests.length > 0) {
    console.log(`최근 요청 ${data.recentRequests.length}개:\n`);
    
    data.recentRequests.forEach((req, i) => {
      console.log(`${i+1}. ${req.id}`);
      console.log(`   사용자: ${req.userName} (${req.userEmail})`);
      console.log(`   학원: ${req.academyName || '없음'}`);
      console.log(`   academyId: ${req.academyId || req.userAcademyId || 'NULL'}`);
      console.log(`   포인트: ${req.requestedPoints}원`);
      console.log(`   상태: ${req.status}`);
      console.log(`   학원 SMS 포인트: ${req.academySmsPoints || 0}원`);
      console.log(`   생성: ${req.createdAt}`);
      if (req.approvedAt) {
        console.log(`   승인: ${req.approvedAt}`);
      }
      console.log('');
    });
    
    // 승인됐는데 포인트 0인 케이스 찾기
    const approvedButZero = data.recentRequests.filter(r => 
      r.status === 'APPROVED' && r.academySmsPoints === 0
    );
    
    if (approvedButZero.length > 0) {
      console.log(`❌ 문제 발견: ${approvedButZero.length}개 요청이 승인됐는데 학원 포인트가 0입니다!`);
      approvedButZero.forEach(r => {
        console.log(`   - ${r.id}: ${r.requestedPoints}원 승인, 학원 포인트 ${r.academySmsPoints}원`);
      });
      console.log('\n→ 승인 API가 Academy.smsPoints를 업데이트하지 못했습니다.');
    }
  } else {
    console.log('⚠️ 요청이 없습니다!');
  }
}

check().catch(console.error);
