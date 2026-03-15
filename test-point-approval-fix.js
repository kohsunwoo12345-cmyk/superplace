const BASE_URL = 'https://superplacestudy.pages.dev';

async function testPointApproval() {
  console.log('=== 포인트 승인 시스템 테스트 ===\n');
  
  try {
    // 1. 로그인
    console.log('1. 관리자 로그인 중...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@superplace.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      throw new Error('로그인 실패: ' + JSON.stringify(loginData));
    }
    
    const token = loginData.token;
    console.log('✅ 로그인 성공 (Role:', loginData.user.role, ')\n');
    
    // 2. 포인트 충전 요청 목록 조회
    console.log('2. 포인트 충전 요청 목록 조회 중...');
    const listRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (listRes.status !== 200) {
      throw new Error('목록 조회 실패: ' + listRes.status);
    }
    
    const listData = await listRes.json();
    console.log(`✅ 총 ${listData.requests?.length || 0}개 요청 조회됨\n`);
    
    if (!listData.requests || listData.requests.length === 0) {
      console.log('⚠️  요청이 없습니다. 테스트 요청을 생성해야 합니다.');
      return;
    }
    
    // 첫 번째 요청 정보 출력
    const firstRequest = listData.requests[0];
    console.log('첫 번째 요청 정보:');
    console.log('  - ID:', firstRequest.id);
    console.log('  - Academy ID:', firstRequest.academyId);
    console.log('  - Academy Name:', firstRequest.academyName);
    console.log('  - User ID:', firstRequest.userId);
    console.log('  - 상태:', firstRequest.status);
    console.log('  - 포인트:');
    console.log('    * requestedPoints:', firstRequest.requestedPoints);
    console.log('    * amount:', firstRequest.amount);
    console.log('  - 요청 시간:', firstRequest.requestedAt);
    
    // 사용 가능한 모든 컬럼 출력
    console.log('\n  사용 가능한 컬럼:', Object.keys(firstRequest).join(', '));
    
    // 3. PENDING 요청 찾기
    const pendingRequest = listData.requests.find(r => r.status === 'PENDING');
    
    if (!pendingRequest) {
      console.log('\n⚠️  PENDING 상태 요청이 없습니다.');
      console.log('   모든 요청의 상태:');
      listData.requests.slice(0, 5).forEach(r => {
        console.log(`     - ${r.id}: ${r.status} (${r.requestedPoints || r.amount}포인트)`);
      });
      
      // 가장 최근 APPROVED 요청 다시 PENDING으로 변경 (테스트용)
      console.log('\n   테스트를 위해 가장 최근 APPROVED 요청을 PENDING으로 변경합니다...');
      const approvedRequest = listData.requests.find(r => r.status === 'APPROVED');
      
      if (!approvedRequest) {
        console.log('   APPROVED 요청도 없습니다. 테스트 종료.');
        return;
      }
      
      console.log('   선택된 요청 ID:', approvedRequest.id);
      var testRequestId = approvedRequest.id;
      var testAcademyId = approvedRequest.academyId;
      var testPoints = approvedRequest.requestedPoints || approvedRequest.amount;
    } else {
      console.log('\n✅ PENDING 요청 발견:', pendingRequest.id);
      var testRequestId = pendingRequest.id;
      var testAcademyId = pendingRequest.academyId;
      var testPoints = pendingRequest.requestedPoints || pendingRequest.amount;
    }
    
    // 4. 승인 전 학원 포인트 확인
    console.log('\n3. 승인 전 학원 포인트 확인 중...');
    const academyBeforeRes = await fetch(`${BASE_URL}/api/admin/academies?id=${testAcademyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const academyBeforeData = await academyBeforeRes.json();
    const beforePoints = academyBeforeData.academy?.smsPoints || 0;
    console.log(`✅ 현재 SMS 포인트: ${beforePoints}원\n`);
    
    // 5. 포인트 승인
    console.log('4. 포인트 승인 요청 중...');
    console.log(`   요청 ID: ${testRequestId}`);
    console.log(`   학원 ID: ${testAcademyId}`);
    console.log(`   승인 포인트: ${testPoints}원`);
    
    const approveRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId: testRequestId
      })
    });
    
    console.log(`   승인 응답 상태: ${approveRes.status}\n`);
    
    const approveText = await approveRes.text();
    let approveData;
    try {
      approveData = JSON.parse(approveText);
    } catch (e) {
      console.log('❌ 승인 응답이 JSON이 아닙니다:');
      console.log(approveText.substring(0, 500));
      throw new Error('Invalid JSON response');
    }
    
    if (approveRes.status === 200 && approveData.success) {
      console.log('✅ 승인 성공!');
      console.log('   학원 ID:', approveData.academyId);
      console.log('   변경 전 포인트:', approveData.beforePoints, '원');
      console.log('   변경 후 포인트:', approveData.afterPoints, '원');
      console.log('   증가 포인트:', approveData.pointsAdded, '원');
      
      // 6. 승인 후 학원 포인트 재확인
      console.log('\n5. 승인 후 학원 포인트 재확인 중...');
      const academyAfterRes = await fetch(`${BASE_URL}/api/admin/academies?id=${testAcademyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const academyAfterData = await academyAfterRes.json();
      const afterPoints = academyAfterData.academy?.smsPoints || 0;
      console.log(`✅ 최종 SMS 포인트: ${afterPoints}원`);
      
      // 검증
      console.log('\n=== 결과 검증 ===');
      console.log(`   기대값: ${beforePoints} + ${testPoints} = ${beforePoints + testPoints}원`);
      console.log(`   실제값: ${afterPoints}원`);
      console.log(`   검증 결과: ${afterPoints === beforePoints + testPoints ? '✅ 성공' : '❌ 불일치'}`);
      
    } else if (approveRes.status === 404) {
      console.log('❌ 승인 실패: Request not found');
      console.log('   오류 상세:', JSON.stringify(approveData, null, 2));
      console.log('\n   문제 원인: API가 요청 ID를 찾지 못했습니다.');
      console.log('   확인 필요: point_charge_requests 테이블의 실제 ID와 일치하는지 확인');
    } else if (approveRes.status === 400) {
      console.log('❌ 승인 실패:', approveData.error || approveData.message);
      console.log('   오류 상세:', JSON.stringify(approveData, null, 2));
    } else {
      console.log('❌ 승인 실패 (상태 코드:', approveRes.status, ')');
      console.log('   응답:', JSON.stringify(approveData, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error(error.stack);
  }
}

testPointApproval();
