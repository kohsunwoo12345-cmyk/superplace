// 실제 배포된 API 코드 확인
const crypto = require('crypto');

async function checkDeployedAPI() {
  console.log('=== 배포된 API 확인 ===\n');
  
  // 실제 배포된 함수 파일 체크썸 확인
  const fs = require('fs');
  const path = require('path');
  
  const apiFile = './functions/api/sender-number/register.ts';
  const content = fs.readFileSync(apiFile, 'utf8');
  
  // 중요 부분 체크
  const hasDuplicateQuery = content.includes('bind(tokenData.email)\n      .first();\n\n    if (!user) {\n      user = await db\n        .prepare(\'SELECT id, email, role, name FROM users WHERE email = ?\')\n        .bind(tokenData.email)');
  
  const hasIdFallback = content.includes('id로 재시도');
  const hasDetailedDebug = content.includes('발신번호 신청 - 사용자 조회 시작');
  
  console.log('로컬 파일 상태:');
  console.log('  중복 쿼리 버그:', hasDuplicateQuery ? '❌ 있음 (수정 필요!)' : '✅ 없음 (수정됨)');
  console.log('  ID fallback:', hasIdFallback ? '✅ 있음' : '❌ 없음');
  console.log('  상세 디버깅:', hasDetailedDebug ? '✅ 있음' : '❌ 없음');
  
  // Git 상태 확인
  const { execSync } = require('child_process');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  const gitLog = execSync('git log --oneline -1', { encoding: 'utf8' });
  
  console.log('\nGit 상태:');
  console.log('  최근 커밋:', gitLog.trim());
  console.log('  변경사항:', gitStatus ? gitStatus.trim() : '없음 (깨끗함)');
  
  // 실제 API 테스트
  console.log('\n실제 배포된 API 테스트:');
  
  const token = 'user-1771479246368-du957iw33|wangholy1@naver.com|DIRECTOR|academy-1771479246368-5viyubmqk|1773707500000';
  
  const FormData = require('form-data');
  const fetch = require('node-fetch');
  
  const formData = new FormData();
  formData.append('companyName', '실제배포테스트');
  formData.append('businessNumber', '123-45-67890');
  formData.append('address', '테스트');
  formData.append('senderNumbers', '010-1234-5678');
  formData.append('representativeName', '테스트');
  formData.append('phone', '010-1234-5678');
  formData.append('email', 'test@test.com');
  
  // 더미 파일
  const dummyBuffer = Buffer.from('test');
  formData.append('telecomCertificate', dummyBuffer, 'test.pdf');
  formData.append('businessRegistration', dummyBuffer, 'test.pdf');
  formData.append('serviceAgreement', dummyBuffer, 'test.pdf');
  formData.append('privacyAgreement', dummyBuffer, 'test.pdf');
  
  try {
    const response = await fetch('https://superplacestudy.pages.dev/api/sender-number/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const data = await response.json();
    
    console.log('  응답 상태:', response.status);
    console.log('  응답 데이터:', JSON.stringify(data, null, 2));
    
    if (response.status === 403) {
      console.log('\n❌ 여전히 403 에러 발생!');
      console.log('문제: 배포가 제대로 안된 것 같습니다.');
    } else if (response.status === 200) {
      console.log('\n✅ 정상 작동!');
    }
  } catch (error) {
    console.log('  에러:', error.message);
  }
}

checkDeployedAPI();
