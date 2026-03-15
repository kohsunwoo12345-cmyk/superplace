const BASE_URL = 'https://superplacestudy.pages.dev';

async function checkApprovalResult() {
  console.log('=== 승인 결과 확인 ===\n');
  
  // 1. 마이그레이션 스크립트로 실제 데이터 확인
  console.log('1. 포인트 충전 요청 데이터 확인...\n');
  const tableRes = await fetch(`${BASE_URL}/api/admin/fix-point-charge-table`);
  const tableData = await tableRes.json();
  
  if (tableData.sampleData && tableData.sampleData.length > 0) {
    console.log(`총 ${tableData.sampleData.length}개 요청:\n`);
    
    tableData.sampleData.forEach(req => {
      console.log(`- ${req.id}`);
      console.log(`  사용자: ${req.userName}`);
      console.log(`  Academy ID: ${req.academyId || req.userAcademyId}`);
      console.log(`  포인트: ${req.requestedPoints}`);
      console.log(`  상태: ${req.status}`);
      console.log('');
    });
    
    // APPROVED 요청 찾기
    const approved = tableData.sampleData.filter(r => r.status === 'APPROVED');
    console.log(`✅ 승인된 요청: ${approved.length}개\n`);
    
    if (approved.length > 0) {
      const firstApproved = approved[0];
      const academyId = firstApproved.academyId || firstApproved.userAcademyId;
      
      console.log('2. 승인된 학원의 실제 포인트 확인...\n');
      
      // 학원 정보 조회
      const academyRes = await fetch(`${BASE_URL}/api/admin/academies?id=${academyId}`, {
        headers: { 'Authorization': 'Bearer test|test@test.com|SUPER_ADMIN|test|123' }
      });
      
      const academyData = await academyRes.json();
      
      if (academyData.success) {
        console.log(`학원: ${academyData.academy.name}`);
        console.log(`SMS 포인트: ${academyData.academy.smsPoints || 0}원`);
        console.log(`승인된 포인트: ${firstApproved.requestedPoints}원`);
        
        if (academyData.academy.smsPoints === 0) {
          console.log('\n❌ 문제: 승인했는데 포인트가 0원입니다!');
          console.log('   → 승인 API가 Academy.smsPoints를 업데이트하지 못했습니다.\n');
        } else if (academyData.academy.smsPoints === firstApproved.requestedPoints) {
          console.log('\n✅ 정상: 포인트가 정확히 증가했습니다!\n');
        } else {
          console.log(`\n⚠️ 포인트: ${academyData.academy.smsPoints}원 (예상: ${firstApproved.requestedPoints}원)\n`);
        }
      }
      
      // 3. SMS stats API로 확인
      console.log('3. SMS stats API 확인...\n');
      const statsRes = await fetch(`${BASE_URL}/api/admin/sms/stats`, {
        headers: { 'Authorization': `Bearer test|test@test.com|DIRECTOR|${academyId}|123` }
      });
      
      const statsData = await statsRes.json();
      console.log(`SMS stats balance: ${statsData.stats?.balance || 0}원`);
      
      if (statsData.stats?.balance === 0) {
        console.log('❌ SMS stats API도 0원을 반환합니다!');
        console.log('   → tokenData.academyId가 제대로 전달되지 않았거나');
        console.log('   → Academy 테이블 조회가 실패했습니다.\n');
      } else {
        console.log('✅ SMS stats API 정상 작동!\n');
      }
    }
  } else {
    console.log('⚠️ 포인트 충전 요청이 없습니다.\n');
  }
}

checkApprovalResult().catch(console.error);
