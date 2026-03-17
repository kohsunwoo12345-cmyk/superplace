// 관리자 계정으로 전체 플로우 테스트

async function testCompleteFlow() {
  console.log('=== 관리자 계정 전체 플로우 테스트 ===\n');
  
  // 1. 로그인
  console.log('1단계: 관리자 로그인');
  const loginResponse = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.co.kr',
      password: 'admin1234!'
    })
  });
  
  const loginData = await loginResponse.json();
  console.log('  응답:', loginResponse.status, loginResponse.statusText);
  
  if (!loginData.success) {
    console.log('❌ 로그인 실패:', loginData.message);
    return;
  }
  
  const token = loginData.token;
  console.log('✅ 로그인 성공!');
  console.log('  토큰:', token);
  console.log('  토큰 길이:', token.length);
  console.log('  토큰 파트:', token.split('|').length, '개');
  
  const parts = token.split('|');
  console.log('  파트 상세:', {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || '(없음)',
    timestamp: parts[4] || '(없음)'
  });
  
  // 2. 발신번호 신청
  console.log('\n2단계: 발신번호 신청');
  
  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('companyName', '완전테스트학원');
  formData.append('businessNumber', '123-45-67890');
  formData.append('address', '서울시 완전테스트구');
  formData.append('senderNumbers', '010-1111-2222,02-1111-2222');
  formData.append('representativeName', '완전테스트');
  formData.append('phone', '010-1111-2222');
  formData.append('email', 'complete@test.com');
  
  const dummyBuffer = Buffer.from('test file');
  formData.append('telecomCertificate', dummyBuffer, 'test.pdf');
  formData.append('businessRegistration', dummyBuffer, 'test.pdf');
  formData.append('serviceAgreement', dummyBuffer, 'test.pdf');
  formData.append('privacyAgreement', dummyBuffer, 'test.pdf');
  
  const senderResponse = await fetch('https://superplacestudy.pages.dev/api/sender-number/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    },
    body: formData
  });
  
  const senderText = await senderResponse.text();
  console.log('  응답:', senderResponse.status, senderResponse.statusText);
  console.log('  응답 본문:', senderText);
  
  let senderData;
  try {
    senderData = JSON.parse(senderText);
  } catch (e) {
    console.log('  JSON 파싱 에러:', e.message);
    return;
  }
  
  if (senderResponse.status === 200) {
    console.log('\n✅✅✅ 완벽! 발신번호 신청 성공!');
    console.log('  Request ID:', senderData.requestId);
  } else if (senderResponse.status === 401) {
    console.log('\n❌ 401 에러 - 인증 실패');
    console.log('  에러:', senderData.error);
    console.log('  원인: Authorization 헤더나 토큰 형식 문제');
  } else if (senderResponse.status === 403) {
    console.log('\n❌ 403 에러 - 권한 없음');
    console.log('  에러:', senderData.error);
    console.log('  상세:', senderData.details || senderData.debugInfo);
    console.log('  원인: 데이터베이스에서 사용자를 찾을 수 없음');
  } else {
    console.log('\n❌ 기타 에러:', senderResponse.status);
    console.log('  데이터:', senderData);
  }
  
  console.log('\n=== 테스트 완료 ===');
}

testCompleteFlow();
