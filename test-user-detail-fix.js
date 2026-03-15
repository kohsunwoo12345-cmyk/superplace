const BASE_URL = 'https://superplacestudy.pages.dev';

async function testUserDetail() {
  console.log('🔍 사용자 상세보기 API 테스트\n');
  
  // 로그인
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const { token } = await loginRes.json();
  console.log('✅ 로그인 완료\n');
  
  // 사용자 목록에서 첫 번째 사용자 가져오기
  const usersRes = await fetch(`${BASE_URL}/api/admin/users?limit=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const usersData = await usersRes.json();
  
  if (!usersData.users || usersData.users.length === 0) {
    console.log('❌ 사용자 없음');
    return;
  }
  
  const testUser = usersData.users[0];
  console.log('테스트 사용자:', testUser.name, '(' + testUser.email + ')');
  console.log('사용자 ID:', testUser.id);
  console.log();
  
  // 사용자 상세보기 API 호출
  console.log('📊 사용자 상세 정보 조회 중...\n');
  
  const detailRes = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}/detail`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('API 상태:', detailRes.status);
  
  if (detailRes.status === 200) {
    const detailData = await detailRes.json();
    
    console.log('\n✅ 상세 정보 조회 성공!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('기본 정보:', detailData.data.user.name);
    console.log('로그인 기록:', detailData.data.loginLogs?.length || 0, '건');
    console.log('활동 로그:', detailData.data.activityLogs?.length || 0, '건');
    console.log('봇 할당:', detailData.data.botAssignments?.length || 0, '건');
    console.log('결제 내역:', detailData.data.payments?.length || 0, '건');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } else {
    const errorData = await detailRes.json();
    console.log('\n❌ 상세 정보 조회 실패');
    console.log('오류:', errorData.error);
    console.log('상세:', errorData.details);
  }
}

testUserDetail().catch(console.error);
