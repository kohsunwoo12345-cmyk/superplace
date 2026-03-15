const BASE_URL = 'https://superplacestudy.pages.dev';

async function quickCheck() {
  console.log('🔍 빠른 상태 확인\n');
  
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@superplace.com', password: 'admin1234' })
  });
  const { token } = await loginRes.json();
  
  // 1. 구독 확인
  const sub = await (await fetch(`${BASE_URL}/api/subscription/check?academyId=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  
  console.log('1️⃣ 구독 정보');
  console.log('  - 구독:', sub.hasSubscription ? '✅' : '❌');
  console.log('  - 플랜:', sub.subscription?.planName || 'N/A');
  console.log('  - 학생 수:', sub.subscription?.usage?.students || '없음');
  console.log('  - 랜딩페이지:', sub.subscription?.usage?.landingPages !== undefined ? sub.subscription.usage.landingPages : '없음');
  console.log('  → 결과:', sub.hasSubscription && sub.subscription?.usage ? '✅ 정상' : '❌ 오류');
  
  // 2. SMS 발신번호
  const sms = await fetch(`${BASE_URL}/api/admin/sms/senders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const smsData = await sms.json();
  
  console.log('\n2️⃣ SMS 발신번호 API');
  console.log('  - 상태:', sms.status);
  console.log('  - 오류:', smsData.error || '없음');
  console.log('  → 결과:', sms.status === 200 ? '✅ 정상' : '❌ 오류');
  
  // 3. 학원 포인트
  const acad = await fetch(`${BASE_URL}/api/admin/academies?id=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const acadData = await acad.json();
  
  console.log('\n3️⃣ 학원 포인트');
  console.log('  - 학원명:', acadData.academy?.name || '없음');
  console.log('  - SMS 포인트:', acadData.academy?.smsPoints !== undefined ? acadData.academy.smsPoints + '원' : '없음');
  console.log('  - 발신번호:', acadData.academy?.senderNumber || '미등록');
  console.log('  → 결과:', acadData.academy?.smsPoints !== undefined ? '✅ 정상' : '❌ 오류');
  
  // 4. 포인트 충전
  const points = await fetch(`${BASE_URL}/api/admin/point-charge-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pointsData = await points.json();
  
  console.log('\n4️⃣ 포인트 충전 시스템');
  console.log('  - 총 요청:', pointsData.requests?.length || 0);
  console.log('  - 승인됨:', pointsData.stats?.approved || 0);
  console.log('  → 결과:', points.status === 200 ? '✅ 정상' : '❌ 오류');
  
  // 최종 요약
  const score = [
    sub.hasSubscription && sub.subscription?.usage,
    sms.status === 200,
    acadData.academy?.smsPoints !== undefined,
    points.status === 200
  ].filter(Boolean).length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 전체 점수: ${score}/4`);
  console.log('='.repeat(50));
  
  if (score === 4) {
    console.log('🎉 모든 시스템 정상!');
  } else {
    console.log(`⚠️  ${4-score}개 시스템에 문제가 있습니다.`);
  }
}

quickCheck().catch(console.error);
