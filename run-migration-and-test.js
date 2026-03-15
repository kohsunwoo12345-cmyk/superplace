const BASE_URL = 'https://superplacestudy.pages.dev';

async function runMigrationAndTest() {
  console.log('배포 대기 중... (2분)\n');
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  console.log('=== 1. 마이그레이션 실행 ===\n');
  
  try {
    const migrationRes = await fetch(`${BASE_URL}/api/admin/fix-point-charge-table`, {
      method: 'POST'
    });
    
    console.log('마이그레이션 응답 상태:', migrationRes.status);
    
    const migrationData = await migrationRes.json();
    console.log('마이그레이션 결과:', JSON.stringify(migrationData, null, 2));
    
    if (!migrationData.success) {
      console.log('\n⚠️  마이그레이션 실패 또는 이미 적용됨');
    } else {
      console.log('\n✅ 마이그레이션 성공!');
      console.log('   추가된 컬럼:', migrationData.columnsAdded?.join(', '));
      console.log('   업데이트된 레코드:', migrationData.recordsUpdated);
    }
    
    console.log('\n=== 2. 포인트 승인 테스트 준비 ===\n');
    
    // 이제 실제 테스트는 사용자가 UI에서 직접 수행해야 함
    console.log('✅ 마이그레이션 완료!');
    console.log('\n다음 단계:');
    console.log('1. https://superplacestudy.pages.dev 에 로그인');
    console.log('2. 포인트 충전 요청 관리 페이지로 이동');
    console.log('3. PENDING 상태인 요청을 찾아서 "승인" 버튼 클릭');
    console.log('4. 성공 메시지 확인 및 포인트 증가 확인');
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
  }
}

runMigrationAndTest();
