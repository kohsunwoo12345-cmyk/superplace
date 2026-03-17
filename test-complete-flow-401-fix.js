// 🔥 완전한 플로우 테스트: 로그인 → 발신번호 신청
// 401/403 에러 완전 해결 검증

const BASE_URL = 'https://superplacestudy.pages.dev';

// 테스트 계정들
const testAccounts = [
  {
    name: 'ADMIN',
    email: 'admin@superplace.co.kr',
    password: 'admin1234!',
    role: 'ADMIN'
  },
  {
    name: 'wangholy1 사용자',
    email: 'wangholy1@naver.com',
    password: 'Test1234!',
    role: 'DIRECTOR'
  },
  {
    name: 'kohsunwoo12345',
    email: 'kohsunwoo12345@gmail.com',
    password: '12341234',
    role: 'user'
  }
];

async function testCompleteFlow(account) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 테스트: ${account.name} (${account.email})`);
  console.log('='.repeat(60));

  // 1️⃣ 로그인
  console.log('\n1️⃣ 로그인 시도...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: account.email,
        password: account.password
      })
    });

    console.log(`   HTTP ${loginRes.status} ${loginRes.statusText}`);
    const loginData = await loginRes.json();
    
    if (loginData.success && loginData.token) {
      console.log('   ✅ 로그인 성공!');
      console.log(`   👤 User ID: ${loginData.user.id}`);
      console.log(`   📧 Email: ${loginData.user.email}`);
      console.log(`   🎭 Role: ${loginData.user.role}`);
      console.log(`   🏫 Academy ID: ${loginData.user.academyId || '(없음)'}`);
      console.log(`   🔑 Token: ${loginData.token.substring(0, 50)}...`);

      // 2️⃣ 발신번호 신청
      console.log('\n2️⃣ 발신번호 신청 시도...');
      
      // FormData 준비
      const formData = new FormData();
      formData.append('companyName', `${account.name} 테스트 학원`);
      formData.append('businessNumber', '123-45-67890');
      formData.append('address', '서울시 강남구 테헤란로 123');
      formData.append('senderNumbers', JSON.stringify([
        { number: '010-1234-5678', memo: '대표번호' }
      ]));
      formData.append('representativeName', account.name);
      formData.append('phone', '010-1234-5678');
      formData.append('email', account.email);

      // 더미 파일 생성 (빈 Blob)
      const dummyFile = new Blob(['test'], { type: 'application/pdf' });
      formData.append('telecomCertificate', dummyFile, 'test.pdf');
      formData.append('businessRegistration', dummyFile, 'test.pdf');
      formData.append('serviceAgreement', dummyFile, 'test.pdf');
      formData.append('privacyAgreement', dummyFile, 'test.pdf');

      const senderRes = await fetch(`${BASE_URL}/api/sender-number/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        },
        body: formData
      });

      console.log(`   HTTP ${senderRes.status} ${senderRes.statusText}`);
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
          console.log('   🐛 Debug info:', JSON.stringify(senderData.debug, null, 2));
        }
        return { success: false, account: account.name, error: senderData.message };
      }

    } else {
      console.log('   ❌ 로그인 실패');
      console.log(`   💬 Error: ${loginData.message}`);
      return { success: false, account: account.name, error: loginData.message };
    }

  } catch (error) {
    console.log('   ❌ 요청 실패:', error.message);
    return { success: false, account: account.name, error: error.message };
  }
}

// 모든 계정 테스트
async function runAllTests() {
  console.log('\n🚀 전체 플로우 테스트 시작');
  console.log('📅 시간:', new Date().toISOString());
  
  const results = [];
  
  for (const account of testAccounts) {
    const result = await testCompleteFlow(account);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  }

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n✅ 성공: ${successCount}/${results.length}`);
  console.log(`❌ 실패: ${failCount}/${results.length}`);
  
  if (failCount > 0) {
    console.log('\n❌ 실패한 계정:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.account}: ${r.error}`);
    });
  }
  
  if (successCount === results.length) {
    console.log('\n🎉 모든 테스트 통과! 401/403 에러 완전 해결됨!');
  } else {
    console.log('\n⚠️  일부 테스트 실패 - 추가 조사 필요');
  }
}

runAllTests().catch(console.error);
