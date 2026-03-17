// 발신번호 403 에러 수정 검증

const testUsers = [
  {
    name: '실제 사용자',
    token: 'user-1771479246368-du957iw33|wangholy1@naver.com|DIRECTOR|academy-1771479246368-5viyubmqk|1773707500000'
  },
  {
    name: '관리자',
    token: '1|admin@superplace.co.kr|ADMIN||1773707500000'
  }
];

async function testSenderNumberAPI(user) {
  console.log(`\n=== ${user.name} 테스트 ===`);
  console.log('토큰:', user.token.substring(0, 50) + '...');
  
  // FormData 생성
  const formData = new FormData();
  formData.append('companyName', '테스트학원');
  formData.append('businessNumber', '123-45-67890');
  formData.append('address', '서울시 테스트구');
  formData.append('senderNumbers', '010-1234-5678,02-1234-5678');
  formData.append('representativeName', '홍길동');
  formData.append('phone', '010-1234-5678');
  formData.append('email', 'test@example.com');
  
  // 더미 파일 생성
  const dummyFile = new Blob(['dummy content'], { type: 'application/pdf' });
  formData.append('telecomCertificate', dummyFile, 'telecom.pdf');
  formData.append('businessRegistration', dummyFile, 'business.pdf');
  formData.append('serviceAgreement', dummyFile, 'service.pdf');
  formData.append('privacyAgreement', dummyFile, 'privacy.pdf');
  
  try {
    const response = await fetch('https://superplacestudy.pages.dev/api/sender-number/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    console.log(`응답 상태: ${response.status}`);
    console.log('응답 데이터:', data);
    
    if (response.status === 200) {
      console.log('✅ 성공:', data.requestId || data.message);
    } else if (response.status === 403) {
      console.log('❌ 403 에러:', data.error);
      console.log('상세:', data.details || data.debugInfo);
    } else {
      console.log(`⚠️ ${response.status} 에러:`, data.error || data.message);
    }
  } catch (error) {
    console.log('❌ 요청 실패:', error.message);
  }
}

async function runTests() {
  console.log('=== 발신번호 403 에러 수정 검증 ===\n');
  console.log('테스트 시작 시각:', new Date().toISOString());
  
  for (const user of testUsers) {
    await testSenderNumberAPI(user);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== 테스트 완료 ===');
  console.log('✅ 모든 테스트가 정상적으로 실행되었습니다.');
  console.log('⚠️ 만약 여전히 403 에러가 발생한다면:');
  console.log('   1. 로그아웃 후 다시 로그인');
  console.log('   2. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)');
  console.log('   3. 시크릿 모드에서 테스트');
}

runTests();
