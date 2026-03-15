const BASE_URL = 'https://superplacestudy.pages.dev';

async function testUserDetailAfterDeployment() {
  console.log('=== 사용자 상세페이지 수정 배포 확인 ===\n');
  
  try {
    // 1. 로그인
    console.log('1. 관리자 로그인 중...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@superplace.com',
        password: 'Rkddnjs!1'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      throw new Error('로그인 실패');
    }
    
    const token = loginData.token;
    console.log('✅ 로그인 성공\n');
    
    // 2. 사용자 목록에서 첫 번째 사용자 가져오기
    console.log('2. 사용자 목록 조회 중...');
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const usersData = await usersRes.json();
    if (!usersData.success || !usersData.users || usersData.users.length === 0) {
      throw new Error('사용자 목록 조회 실패');
    }
    
    const testUser = usersData.users[0];
    console.log(`✅ 테스트 사용자: ${testUser.name} (${testUser.email})`);
    console.log(`   User ID: ${testUser.id}\n`);
    
    // 3. 사용자 상세 정보 API 호출
    console.log('3. 사용자 상세 정보 API 호출 중...');
    const detailRes = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}/detail`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   응답 상태: ${detailRes.status} ${detailRes.statusText}`);
    
    const detailData = await detailRes.json();
    
    if (detailRes.status !== 200) {
      console.error('❌ API 오류:', JSON.stringify(detailData, null, 2));
      return;
    }
    
    console.log('✅ API 응답 성공\n');
    
    // 4. 응답 구조 확인
    console.log('4. 응답 구조 확인:');
    console.log('   - detailData.success:', detailData.success);
    console.log('   - detailData.data 존재:', !!detailData.data);
    console.log('   - detailData.data.user 존재:', !!(detailData.data && detailData.data.user));
    
    if (detailData.data && detailData.data.user) {
      const user = detailData.data.user;
      console.log('\n   사용자 정보:');
      console.log(`     - 이름: ${user.name}`);
      console.log(`     - 이메일: ${user.email}`);
      console.log(`     - 역할: ${user.role}`);
      console.log(`     - 학원: ${user.academyName || '없음'}`);
      console.log(`     - 포인트: ${user.points || 0}`);
      
      console.log('\n   추가 데이터:');
      console.log(`     - 로그인 기록: ${detailData.data.loginLogs?.length || 0}개`);
      console.log(`     - 활동 기록: ${detailData.data.activityLogs?.length || 0}개`);
      console.log(`     - 봇 할당: ${detailData.data.botAssignments?.length || 0}개`);
      console.log(`     - 결제 내역: ${detailData.data.payments?.length || 0}개`);
      
      console.log('\n✅ 프론트엔드에서 data.data.user로 접근 가능');
    } else if (detailData.user) {
      console.log('\n⚠️  경고: 이전 구조 (data.user)로 반환됨');
      console.log('   프론트엔드 수정이 필요할 수 있습니다.');
    } else {
      console.log('\n❌ 오류: 사용자 데이터를 찾을 수 없습니다.');
      console.log('   응답 구조:', JSON.stringify(detailData, null, 2).substring(0, 500));
    }
    
    console.log('\n=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error(error.stack);
  }
}

// 배포 대기 후 테스트
console.log('배포 완료 대기 중... (2분)\n');
setTimeout(() => {
  testUserDetailAfterDeployment();
}, 120000); // 2분 대기
