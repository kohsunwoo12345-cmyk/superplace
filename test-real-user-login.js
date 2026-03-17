// 실제 사용자 계정으로 로그인 후 발신번호 신청 테스트

async function testRealUserFlow() {
  console.log('=== 실제 사용자 플로우 테스트 ===\n');
  
  // 1. 로그인 테스트
  console.log('1단계: 로그인 테스트');
  const loginResponse = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'wangholy1@naver.com',
      password: 'Test1234!'
    })
  });
  
  const loginData = await loginResponse.json();
  console.log('  로그인 응답:', loginResponse.status);
  console.log('  로그인 데이터:', JSON.stringify(loginData, null, 2));
  
  if (!loginData.success) {
    console.log('\n❌ 로그인 실패! 비밀번호를 확인해주세요.');
    return;
  }
  
  const token = loginData.token;
  console.log('\n✅ 로그인 성공!');
  console.log('  토큰:', token.substring(0, 50) + '...');
  console.log('  토큰 파트:', token.split('|').length, '개');
  
  // 2. 발신번호 신청 테스트
  console.log('\n2단계: 발신번호 신청 테스트');
  
  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('companyName', '실제테스트학원');
  formData.append('businessNumber', '123-45-67890');
  formData.append('address', '서울시 테스트구');
  formData.append('senderNumbers', '010-9999-8888,02-9999-7777');
  formData.append('representativeName', '테스트');
  formData.append('phone', '010-9999-8888');
  formData.append('email', 'test@test.com');
  
  const dummyBuffer = Buffer.from('test file content');
  formData.append('telecomCertificate', dummyBuffer, 'telecom.pdf');
  formData.append('businessRegistration', dummyBuffer, 'business.pdf');
  formData.append('serviceAgreement', dummyBuffer, 'service.pdf');
  formData.append('privacyAgreement', dummyBuffer, 'privacy.pdf');
  
  const senderResponse = await fetch('https://superplacestudy.pages.dev/api/sender-number/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    },
    body: formData
  });
  
  const senderData = await senderResponse.json();
  console.log('  발신번호 응답:', senderResponse.status);
  console.log('  발신번호 데이터:', JSON.stringify(senderData, null, 2));
  
  if (senderResponse.status === 200) {
    console.log('\n✅ 발신번호 신청 성공!');
    console.log('  Request ID:', senderData.requestId);
  } else if (senderResponse.status === 401) {
    console.log('\n❌ 401 에러 - 인증 실패!');
    console.log('  문제: Authorization 헤더나 토큰 검증 문제');
  } else if (senderResponse.status === 403) {
    console.log('\n❌ 403 에러 - 사용자 찾기 실패!');
    console.log('  문제: 데이터베이스에서 사용자를 찾을 수 없음');
  }
  
  console.log('\n=== 테스트 완료 ===');
}

testRealUserFlow();
