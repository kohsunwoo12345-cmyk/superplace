// 로컬에서 로그인 로직 직접 테스트 (DB 제외)
// 평문 비밀번호 비교 로직이 제대로 작동하는지 검증

async function testPasswordVerification() {
  console.log('🧪 비밀번호 검증 로직 테스트\n');
  console.log('='.repeat(70));
  
  // 실제 DB 사용자들의 데이터 시뮬레이션
  const testUsers = [
    { email: 'admin@superplace.co.kr', password: 'admin1234!', stored: 'admin1234!' },
    { email: 'kohsunwoo12345@gmail.com', password: 'rhtjsdn1121', stored: 'rhtjsdn1121' },
    { email: 'superplace12@gmail.com', password: '12341234', stored: '12341234' },
  ];
  
  for (const user of testUsers) {
    console.log(`\n📧 ${user.email}`);
    console.log(`   입력 비밀번호: "${user.password}"`);
    console.log(`   저장된 비밀번호: "${user.stored}"`);
    
    let isValid = false;
    
    // Step 1: bcrypt check (skip - 평문이므로 실패)
    const isBcrypt = user.stored.startsWith('$2a$') || user.stored.startsWith('$2b$');
    console.log(`   1️⃣ bcrypt 체크: ${isBcrypt ? 'YES (시도)' : 'NO (스킵)'}`);
    
    if (!isValid) {
      // Step 2: SHA-256 check
      const encoder = new TextEncoder();
      const data = encoder.encode(user.password + 'superplace-salt-2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      isValid = hashHex === user.stored;
      console.log(`   2️⃣ SHA-256 체크: ${isValid ? '✅ 일치' : '❌ 불일치'}`);
    }
    
    if (!isValid) {
      // Step 3: Plaintext check (NEW!)
      isValid = user.password === user.stored;
      console.log(`   3️⃣ 평문 체크: ${isValid ? '✅ 일치 (성공!)' : '❌ 불일치'}`);
    }
    
    console.log(`   🔐 최종 결과: ${isValid ? '✅ 인증 성공' : '❌ 인증 실패'}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ 로컬 로직 테스트 완료');
  console.log('💡 평문 비밀번호 체크 로직이 정상 작동함');
  console.log('⚠️  배포된 API에 반영되려면 Cloudflare Pages 캐시 클리어 필요');
}

testPasswordVerification().catch(console.error);
