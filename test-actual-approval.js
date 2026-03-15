const BASE_URL = 'https://superplacestudy.pages.dev';

async function testActualApproval() {
  console.log('=== 실제 포인트 승인 테스트 ===\n');
  
  try {
    // 1. 실제 사용자 계정으로 로그인 시도
    console.log('1. 로그인 시도 중...\n');
    
    // 여러 계정 시도
    const accounts = [
      { email: 'wangholy1@naver.com', password: 'Rkddnjs!1', name: 'wangholy1' },
      { email: 'wangholy5@naver.com', password: 'Rkddnjs!1', name: 'wangholy5' },
      { email: 'admin@superplace.com', password: 'admin123', name: 'admin' }
    ];
    
    let token = null;
    let userInfo = null;
    
    for (const account of accounts) {
      console.log(`  시도: ${account.email}`);
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: account.password
        })
      });
      
      const loginData = await loginRes.json();
      if (loginData.success && loginData.token) {
        token = loginData.token;
        userInfo = loginData.user;
        console.log(`  ✅ ${account.name} 로그인 성공!`);
        console.log(`     Role: ${userInfo.role}`);
        console.log(`     User ID: ${userInfo.id}\n`);
        break;
      } else {
        console.log(`  ❌ 실패: ${loginData.message}\n`);
      }
    }
    
    if (!token) {
      console.log('❌ 모든 계정 로그인 실패');
      return;
    }
    
    // 2. 포인트 충전 요청 목록 조회
    console.log('2. 포인트 충전 요청 목록 조회...\n');
    const listRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   응답 상태: ${listRes.status}`);
    
    if (listRes.status !== 200) {
      const errorData = await listRes.json();
      console.log('   오류:', errorData);
      return;
    }
    
    const listData = await listRes.json();
    console.log(`   ✅ 총 ${listData.requests?.length || 0}개 요청 조회\n`);
    
    if (!listData.requests || listData.requests.length === 0) {
      console.log('⚠️  요청이 없습니다.');
      return;
    }
    
    // 첫 번째 요청 상세 정보
    const req = listData.requests[0];
    console.log('3. 첫 번째 요청 정보:');
    console.log(`   ID: ${req.id}`);
    console.log(`   사용자: ${req.userName} (${req.userEmail})`);
    console.log(`   학원: ${req.academyName}`);
    console.log(`   Academy ID: ${req.academyId}`);
    console.log(`   요청 포인트: ${req.requestedPoints || req.amount}원`);
    console.log(`   상태: ${req.status}`);
    console.log(`   요청 시간: ${req.requestedAt || req.createdAt}\n`);
    
    // 실제 컬럼 확인
    console.log('   실제 데이터 구조:');
    Object.keys(req).forEach(key => {
      if (req[key] !== null && req[key] !== undefined) {
        console.log(`     - ${key}: ${req[key]}`);
      }
    });
    console.log('');
    
    // 테스트할 요청 선택
    let testReq = listData.requests.find(r => r.status === 'PENDING');
    if (!testReq) {
      console.log('⚠️  PENDING 요청이 없습니다. 첫 번째 요청으로 테스트합니다.\n');
      testReq = req;
    } else {
      console.log(`✅ PENDING 요청 발견: ${testReq.id}\n`);
    }
    
    // 4. 승인 전 학원 포인트 확인
    console.log('4. 승인 전 학원 포인트 확인...\n');
    const academyRes = await fetch(`${BASE_URL}/api/admin/academies?id=${testReq.academyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const academyData = await academyRes.json();
    console.log(`   응답 상태: ${academyRes.status}`);
    console.log(`   학원 이름: ${academyData.academy?.name}`);
    console.log(`   현재 SMS 포인트: ${academyData.academy?.smsPoints || 0}원\n`);
    
    // 5. 포인트 승인 시도
    console.log('5. 포인트 승인 시도...\n');
    console.log(`   요청 ID: ${testReq.id}`);
    console.log(`   승인할 포인트: ${testReq.requestedPoints || testReq.amount}원\n`);
    
    const approveRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId: testReq.id
      })
    });
    
    console.log(`   승인 응답 상태: ${approveRes.status}`);
    
    const approveText = await approveRes.text();
    console.log(`   응답 길이: ${approveText.length} bytes\n`);
    
    let approveData;
    try {
      approveData = JSON.parse(approveText);
      console.log('   승인 응답 데이터:');
      console.log(JSON.stringify(approveData, null, 2));
    } catch (e) {
      console.log('   ❌ JSON 파싱 실패');
      console.log('   Raw 응답:');
      console.log(approveText.substring(0, 1000));
    }
    
    if (approveRes.status === 200 && approveData?.success) {
      console.log('\n✅ 승인 성공!');
      console.log(`   학원 ID: ${approveData.academyId}`);
      console.log(`   학원 이름: ${approveData.academyName}`);
      console.log(`   변경 전 포인트: ${approveData.beforePoints}원`);
      console.log(`   변경 후 포인트: ${approveData.afterPoints}원`);
      console.log(`   증가 포인트: ${approveData.pointsAdded}원`);
      
      // 6. 승인 후 재확인
      console.log('\n6. 승인 후 학원 포인트 재확인...\n');
      const afterRes = await fetch(`${BASE_URL}/api/admin/academies?id=${testReq.academyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const afterData = await afterRes.json();
      console.log(`   최종 SMS 포인트: ${afterData.academy?.smsPoints || 0}원`);
      
      const expected = (academyData.academy?.smsPoints || 0) + (testReq.requestedPoints || testReq.amount);
      const actual = afterData.academy?.smsPoints || 0;
      
      console.log(`\n   검증: ${expected}원 예상, ${actual}원 실제 → ${expected === actual ? '✅ 일치' : '❌ 불일치'}`);
      
    } else {
      console.log('\n❌ 승인 실패!');
      if (approveData?.error) {
        console.log(`   에러: ${approveData.error}`);
      }
      if (approveData?.message) {
        console.log(`   메시지: ${approveData.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    console.error(error.stack);
  }
}

testActualApproval();
