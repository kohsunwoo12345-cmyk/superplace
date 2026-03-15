const BASE_URL = 'https://superplacestudy.pages.dev';

async function finalTest() {
  console.log('배포 대기 중... (2분)\n');
  
  // 2분 대기
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  console.log('=== 포인트 승인 최종 테스트 ===\n');
  
  try {
    // 실제 동작하는 계정으로 로그인 시도
    console.log('1. 로그인 시도 중...');
    
    // 여러 계정으로 시도
    const accounts = [
      { email: 'admin@superplace.com', password: 'admin123' },
      { email: 'admin@superplace.com', password: 'Rkddnjs!1' },
      { email: 'wangholy1@naver.com', password: 'Rkddnjs!1' }
    ];
    
    let token = null;
    let userRole = null;
    
    for (const account of accounts) {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      
      const loginData = await loginRes.json();
      if (loginData.success && loginData.token) {
        token = loginData.token;
        userRole = loginData.user.role;
        console.log(`✅ ${account.email} 로그인 성공 (Role: ${userRole})\n`);
        break;
      }
    }
    
    if (!token) {
      console.log('❌ 모든 계정 로그인 실패');
      console.log('   새로운 관리자 계정을 생성해야 합니다.\n');
      
      // 관리자 초기화 API 호출
      console.log('2. 관리자 계정 초기화 시도...');
      const initRes = await fetch(`${BASE_URL}/api/init-admin`, {
        method: 'POST'
      });
      
      const initText = await initRes.text();
      console.log('   응답:', initText.substring(0, 200));
      return;
    }
    
    // 2. 포인트 충전 요청 목록 조회
    console.log('2. 포인트 충전 요청 목록 조회 중...');
    const listRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   응답 상태: ${listRes.status}`);
    
    if (listRes.status !== 200) {
      const errorText = await listRes.text();
      console.log('   오류:', errorText.substring(0, 300));
      return;
    }
    
    const listData = await listRes.json();
    console.log(`✅ 총 ${listData.requests?.length || 0}개 요청\n`);
    
    if (!listData.requests || listData.requests.length === 0) {
      console.log('⚠️  요청이 없습니다.');
      return;
    }
    
    // 첫 번째 요청 정보
    const firstReq = listData.requests[0];
    console.log('첫 번째 요청:');
    console.log('  - ID:', firstReq.id);
    console.log('  - Academy:', firstReq.academyName, '(', firstReq.academyId, ')');
    console.log('  - 포인트:', firstReq.requestedPoints || firstReq.amount);
    console.log('  - 상태:', firstReq.status);
    
    // 모든 요청의 상태 확인
    const statusCount = listData.requests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    console.log('\n  상태별 통계:', statusCount);
    
    // PENDING 요청 찾기 또는 APPROVED 요청 선택
    let testRequest = listData.requests.find(r => r.status === 'PENDING');
    
    if (!testRequest) {
      console.log('\n⚠️  PENDING 요청이 없어서 APPROVED 요청으로 테스트합니다.');
      testRequest = listData.requests.find(r => r.status === 'APPROVED');
      
      if (!testRequest) {
        console.log('   테스트할 요청이 없습니다.');
        return;
      }
    }
    
    console.log('\n3. 테스트 요청 선택:', testRequest.id);
    console.log('   Academy ID:', testRequest.academyId);
    console.log('   포인트:', testRequest.requestedPoints || testRequest.amount);
    
    // 승인 전 학원 포인트 확인
    console.log('\n4. 승인 전 학원 포인트 확인...');
    const beforeRes = await fetch(`${BASE_URL}/api/admin/academies?id=${testRequest.academyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const beforeData = await beforeRes.json();
    const beforePoints = beforeData.academy?.smsPoints || 0;
    console.log(`✅ 현재 포인트: ${beforePoints}원`);
    
    // 승인 요청
    console.log('\n5. 포인트 승인 요청 중...');
    const approveRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId: testRequest.id
      })
    });
    
    console.log(`   응답 상태: ${approveRes.status}`);
    
    const approveData = await approveRes.json();
    
    if (approveRes.status === 200 && approveData.success) {
      console.log('✅ 승인 성공!');
      console.log('   변경 전:', approveData.beforePoints, '원');
      console.log('   변경 후:', approveData.afterPoints, '원');
      console.log('   증가분:', approveData.pointsAdded, '원');
      
      // 최종 확인
      console.log('\n6. 최종 학원 포인트 확인...');
      const afterRes = await fetch(`${BASE_URL}/api/admin/academies?id=${testRequest.academyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const afterData = await afterRes.json();
      const afterPoints = afterData.academy?.smsPoints || 0;
      console.log(`✅ 최종 포인트: ${afterPoints}원`);
      
      const pointsToAdd = testRequest.requestedPoints || testRequest.amount;
      const expected = beforePoints + pointsToAdd;
      console.log('\n=== 검증 결과 ===');
      console.log(`   기대값: ${beforePoints} + ${pointsToAdd} = ${expected}원`);
      console.log(`   실제값: ${afterPoints}원`);
      console.log(`   ${afterPoints === expected ? '✅ 성공' : '❌ 불일치 (차이: ' + (afterPoints - expected) + '원)'}`);
      
    } else if (approveRes.status === 404) {
      console.log('❌ 404 오류: Request not found');
      console.log('   응답:', JSON.stringify(approveData, null, 2));
    } else if (approveRes.status === 400) {
      console.log('❌ 400 오류:', approveData.error || approveData.message);
      console.log('   응답:', JSON.stringify(approveData, null, 2));
    } else {
      console.log('❌ 승인 실패');
      console.log('   응답:', JSON.stringify(approveData, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    console.error(error.stack);
  }
}

finalTest();
