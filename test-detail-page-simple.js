const BASE_URL = 'https://superplacestudy.pages.dev';

async function quickTest() {
  console.log('=== 사용자 상세페이지 테스트 ===\n');
  
  try {
    // 로그인
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@superplace.com',
        password: 'Rkddnjs!1'
      })
    });
    
    const loginText = await loginRes.text();
    console.log('로그인 응답 상태:', loginRes.status);
    
    let loginData;
    try {
      loginData = JSON.parse(loginText);
    } catch (e) {
      console.log('로그인 응답 (텍스트):', loginText.substring(0, 200));
      throw new Error('로그인 응답이 JSON이 아닙니다');
    }
    
    if (!loginData.token) {
      console.log('로그인 응답:', JSON.stringify(loginData, null, 2));
      throw new Error('토큰이 없습니다');
    }
    
    const token = loginData.token;
    console.log('✅ 로그인 성공\n');
    
    // 사용자 목록
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const usersData = await usersRes.json();
    const testUser = usersData.users[0];
    console.log(`테스트 사용자: ${testUser.name} (ID: ${testUser.id})\n`);
    
    // 상세 정보
    const detailRes = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}/detail`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`상세 API 응답: ${detailRes.status}`);
    
    const detailData = await detailRes.json();
    
    if (detailData.data && detailData.data.user) {
      console.log('✅ 구조 정상: data.data.user 존재');
      console.log(`   이름: ${detailData.data.user.name}`);
      console.log(`   이메일: ${detailData.data.user.email}`);
    } else {
      console.log('❌ 구조 오류:', Object.keys(detailData));
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

quickTest();
