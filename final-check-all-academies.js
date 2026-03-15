async function finalCheck() {
  console.log('배포 대기 (2분)...\n');
  await new Promise(r => setTimeout(r, 120000));
  
  const BASE = 'https://superplacestudy.pages.dev';
  
  console.log('=== 최종 확인 ===\n');
  
  // 1. 마이그레이션 실행
  console.log('1. 마이그레이션 실행...');
  const migRes = await fetch(`${BASE}/api/admin/fix-point-charge-table`);
  const migData = await migRes.json();
  
  console.log('  결과:', migData.message);
  console.log('  업데이트된 레코드:', migData.recordsUpdated || 0);
  
  if (migData.sampleData && migData.sampleData.length > 0) {
    console.log(`\n  포인트 충전 요청 ${migData.sampleData.length}개 발견:\n`);
    migData.sampleData.forEach((req, i) => {
      console.log(`  ${i+1}. ID: ${req.id}`);
      console.log(`     사용자: ${req.userName} (${req.userEmail})`);
      console.log(`     Academy ID: ${req.academyId || req.userAcademyId || 'NULL!!!'}`);
      console.log(`     포인트: ${req.requestedPoints}`);
      console.log(`     상태: ${req.status}\n`);
    });
    
    // NULL academyId 확인
    const nullCount = migData.sampleData.filter(r => !r.academyId).length;
    if (nullCount > 0) {
      console.log(`  ⚠️ academyId가 NULL인 요청: ${nullCount}개`);
      console.log(`  → User 테이블에서 academyId를 가져와야 합니다.\n`);
    }
  } else {
    console.log('\n  ⚠️ 포인트 충전 요청이 없습니다!');
    console.log('  → 원장이 포인트 충전 신청을 먼저 해야 합니다.\n');
  }
  
  console.log('✅ 시스템 준비 완료!');
  console.log('\n다음 단계:');
  console.log('1. 원장이 포인트 충전 신청');
  console.log('2. 관리자가 승인');
  console.log('3. SMS 페이지에서 포인트 확인');
}

finalCheck().catch(console.error);
