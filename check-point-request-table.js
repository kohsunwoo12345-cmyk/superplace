const BASE_URL = 'https://superplacestudy.pages.dev';

async function checkPointRequestTable() {
  console.log('=== 포인트 충전 요청 테이블 확인 ===\n');
  
  try {
    // 1. 로그인 (wangholy1@naver.com으로 시도)
    console.log('1. 로그인 시도 중...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wangholy1@naver.com',
        password: 'Rkddnjs!1'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success && !loginData.token) {
      console.log('wangholy1 로그인 실패, admin 계정으로 재시도...');
      
      const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wangholy5@naver.com',
          password: 'Rkddnjs!1'
        })
      });
      
      const adminLoginData = await adminLoginRes.json();
      if (!adminLoginData.success && !adminLoginData.token) {
        throw new Error('로그인 실패: ' + JSON.stringify(adminLoginData));
      }
      
      var token = adminLoginData.token;
      console.log('✅ wangholy5 로그인 성공\n');
    } else {
      var token = loginData.token;
      console.log('✅ wangholy1 로그인 성공\n');
    }
    
    // 2. 포인트 충전 요청 목록 조회
    console.log('2. 포인트 충전 요청 목록 조회 중...');
    const listRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('   응답 상태:', listRes.status);
    
    const listData = await listRes.json();
    console.log('   총 요청 수:', listData.requests?.length || 0);
    
    if (listData.requests && listData.requests.length > 0) {
      const firstRequest = listData.requests[0];
      console.log('\n   첫 번째 요청 정보:');
      console.log('   - ID:', firstRequest.id);
      console.log('   - Academy ID:', firstRequest.academyId);
      console.log('   - Academy Name:', firstRequest.academyName);
      console.log('   - User ID:', firstRequest.userId);
      console.log('   - 요청 포인트 (requestedPoints):', firstRequest.requestedPoints);
      console.log('   - 요청 포인트 (amount):', firstRequest.amount);
      console.log('   - 상태:', firstRequest.status);
      console.log('   - 요청 시간:', firstRequest.requestedAt);
      
      // 테이블 컬럼 확인
      console.log('\n   사용 가능한 컬럼:');
      Object.keys(firstRequest).forEach(key => {
        console.log(`     - ${key}: ${typeof firstRequest[key]}`);
      });
      
      // PENDING 상태인 요청 찾기
      const pendingRequest = listData.requests.find(r => r.status === 'PENDING');
      
      if (pendingRequest) {
        console.log('\n✅ PENDING 상태 요청 발견:', pendingRequest.id);
        console.log('   이 요청으로 승인 테스트를 진행합니다...\n');
        
        // 3. 포인트 승인 시도
        console.log('3. 포인트 승인 시도 중...');
        const approveRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requestId: pendingRequest.id
          })
        });
        
        console.log('   승인 응답 상태:', approveRes.status);
        
        const approveData = await approveRes.json();
        console.log('   승인 응답:', JSON.stringify(approveData, null, 2));
        
        if (approveRes.status === 200 && approveData.success) {
          console.log('\n✅ 승인 성공!');
          console.log('   학원 ID:', approveData.academyId);
          console.log('   변경 전 포인트:', approveData.beforePoints);
          console.log('   변경 후 포인트:', approveData.afterPoints);
          console.log('   증가 포인트:', approveData.pointsAdded);
        } else {
          console.log('\n❌ 승인 실패:', approveData.error || approveData.message);
        }
      } else {
        console.log('\n⚠️  PENDING 상태인 요청이 없습니다.');
        console.log('   모든 요청 상태:', listData.requests.map(r => `${r.id}: ${r.status}`).join(', '));
      }
    } else {
      console.log('   요청이 없습니다.');
    }
    
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    console.error(error.stack);
  }
}

checkPointRequestTable();
