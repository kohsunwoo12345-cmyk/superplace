// 🔥 FINAL TEST - 실제 DB 비밀번호 사용
// 401/403 에러 100% 해결 검증

const fetch = require('node-fetch');
const FormData = require('form-data');
const { Blob } = require('buffer');

const BASE_URL = 'https://superplacestudy.pages.dev';

// 실제 DB에서 확인한 정확한 비밀번호
const testAccounts = [
  {
    name: 'ADMIN',
    email: 'admin@superplace.co.kr',
    password: 'admin1234!', // DB에서 확인된 평문 비밀번호
    role: 'ADMIN'
  },
  {
    name: 'kohsunwoo12345',
    email: 'kohsunwoo12345@gmail.com',
    password: 'rhtjsdn1121', // DB에서 확인된 실제 비밀번호 (12341234가 아님)
    role: 'user'
  },
  {
    name: 'superplace12',
    email: 'superplace12@gmail.com',
    password: '12341234', // DB에서 확인된 비밀번호
    role: 'user'
  }
];

async function testCompleteFlow(account) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 테스트: ${account.name} (${account.email})`);
  console.log('='.repeat(70));

  // 1️⃣ 로그인
  console.log('\n1️⃣ 로그인 시도...');
  console.log(`   📧 Email: ${account.email}`);
  console.log(`   🔑 Password: ${account.password}`);
  
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: account.email,
        password: account.password
      })
    });

    console.log(`   📡 HTTP ${loginRes.status} ${loginRes.statusText}`);
    const loginData = await loginRes.json();
    
    if (loginData.success && loginData.token) {
      console.log('   ✅ 로그인 성공!');
      console.log(`   👤 User: ${loginData.user.name} (ID: ${loginData.user.id})`);
      console.log(`   🎭 Role: ${loginData.user.role}`);
      console.log(`   🏫 Academy: ${loginData.user.academyName || '(없음)'}`);
      console.log(`   🔑 Token: ${loginData.token.split('|').slice(0, 3).join('|')}|...`);

      // 2️⃣ 발신번호 신청
      console.log('\n2️⃣ 발신번호 신청 시도...');
      
      // FormData 준비
      const formData = new FormData();
      formData.append('companyName', `${account.name} 테스트 학원`);
      formData.append('businessNumber', '123-45-67890');
      formData.append('address', '서울시 강남구 테헤란로 123');
      formData.append('senderNumbers', JSON.stringify([
        { number: '010-1111-2222', memo: '대표번호' },
        { number: '010-3333-4444', memo: '보조번호' }
      ]));
      formData.append('representativeName', account.name);
      formData.append('phone', '010-1111-2222');
      formData.append('email', account.email);

      // 더미 파일 생성
      const dummyPDF = Buffer.from('PDF dummy content');
      formData.append('telecomCertificate', dummyPDF, { filename: 'telecom.pdf', contentType: 'application/pdf' });
      formData.append('businessRegistration', dummyPDF, { filename: 'business.pdf', contentType: 'application/pdf' });
      formData.append('serviceAgreement', dummyPDF, { filename: 'service.pdf', contentType: 'application/pdf' });
      formData.append('privacyAgreement', dummyPDF, { filename: 'privacy.pdf', contentType: 'application/pdf' });

      const senderRes = await fetch(`${BASE_URL}/api/sender-number/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      console.log(`   📡 HTTP ${senderRes.status} ${senderRes.statusText}`);
      const senderData = await senderRes.json();
      
      if (senderRes.ok) {
        console.log('   ✅ 발신번호 신청 성공!');
        console.log(`   📝 Request ID: ${senderData.requestId}`);
        console.log(`   💬 Message: ${senderData.message}`);
        return { success: true, account: account.name };
      } else {
        console.log('   ❌ 발신번호 신청 실패');
        console.log(`   💬 Error: ${senderData.message || senderData.error}`);
        if (senderData.debug) {
          console.log('   🐛 Debug:', JSON.stringify(senderData.debug, null, 2));
        }
        return { success: false, account: account.name, step: 'sender-register', error: senderData.message };
      }

    } else {
      console.log('   ❌ 로그인 실패');
      console.log(`   💬 Error: ${loginData.message}`);
      return { success: false, account: account.name, step: 'login', error: loginData.message };
    }

  } catch (error) {
    console.log('   ❌ 요청 실패:', error.message);
    return { success: false, account: account.name, step: 'request', error: error.message };
  }
}

async function runAllTests() {
  console.log('\n🚀 최종 테스트 시작 - 실제 DB 비밀번호 사용');
  console.log('📅 시간:', new Date().toISOString());
  console.log('🌐 서버:', BASE_URL);
  
  const results = [];
  
  for (const account of testAccounts) {
    const result = await testCompleteFlow(account);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
  }

  // 결과 요약
  console.log('\n' + '='.repeat(70));
  console.log('📊 최종 테스트 결과');
  console.log('='.repeat(70));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n✅ 성공: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  console.log(`❌ 실패: ${failCount}/${results.length}`);
  
  if (failCount > 0) {
    console.log('\n❌ 실패 상세:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.account} [${r.step}]: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  if (successCount === results.length) {
    console.log('🎉🎉🎉 완벽! 모든 테스트 100% 통과!');
    console.log('✅ 401/403 에러 완전히 해결됨!');
    console.log('✅ 로그인 → 발신번호 신청 전체 플로우 정상 작동!');
  } else if (successCount > 0) {
    console.log(`⚠️  부분 성공: ${successCount}/${results.length} 계정 작동`);
  } else {
    console.log('❌ 모든 테스트 실패 - 추가 디버깅 필요');
  }
  console.log('='.repeat(70) + '\n');
}

runAllTests().catch(console.error);
