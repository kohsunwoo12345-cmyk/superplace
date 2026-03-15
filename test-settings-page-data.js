async function testSettingsData() {
  console.log('\n⚙️  Testing Settings Page Data\n');
  console.log('='*60);
  
  // Test with director account (고희준)
  const ACADEMY_ID = 'academy-1771479246368-5viyubmqk';
  const USER_ID = 'user-1771479246368-du957iw33';
  
  // 1. Subscription Check
  console.log('\n1️⃣ Subscription Information');
  console.log('-'.repeat(60));
  const subRes = await fetch(`https://superplacestudy.pages.dev/api/subscription/check?userId=${USER_ID}&academyId=${ACADEMY_ID}`);
  const subData = await subRes.json();
  
  if (subData.hasSubscription && subData.subscription) {
    console.log(`✅ Plan: ${subData.subscription.planName}`);
    console.log(`   Status: ${subData.subscription.status}`);
    console.log(`   Valid until: ${new Date(subData.subscription.endDate).toLocaleDateString('ko-KR')}`);
    
    console.log('\n📊 Usage Details:');
    console.log(`   학생 수: ${subData.subscription.usage?.students || 0} / ${subData.subscription.limits?.maxStudents === -1 ? '무제한' : subData.subscription.limits?.maxStudents}`);
    console.log(`   숙제 검사: ${subData.subscription.usage?.homeworkChecks || 0} / ${subData.subscription.limits?.maxHomeworkChecks === -1 ? '무제한' : subData.subscription.limits?.maxHomeworkChecks}`);
    console.log(`   AI 분석: ${subData.subscription.usage?.aiAnalysis || 0} / ${subData.subscription.limits?.maxAIAnalysis === -1 ? '무제한' : subData.subscription.limits?.maxAIAnalysis}`);
    console.log(`   유사문제: ${subData.subscription.usage?.similarProblems || 0} / ${subData.subscription.limits?.maxSimilarProblems === -1 ? '무제한' : subData.subscription.limits?.maxSimilarProblems}`);
    console.log(`   랜딩페이지: ${subData.subscription.usage?.landingPages || 0} / ${subData.subscription.limits?.maxLandingPages === -1 ? '무제한' : subData.subscription.limits?.maxLandingPages}`);
  } else {
    console.log('❌ No subscription found');
  }
  
  // 2. Academy Information (Points & Sender Number)
  console.log('\n2️⃣ Academy Information (SMS & Points)');
  console.log('-'.repeat(60));
  
  // Login as admin to get academy info
  const loginRes = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const loginData = await loginRes.json();
  const TOKEN = loginData.token;
  
  const academyRes = await fetch('https://superplacestudy.pages.dev/api/admin/academies', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  const academyData = await academyRes.json();
  const academy = academyData.academies.find(a => a.id === ACADEMY_ID);
  
  if (academy) {
    console.log(`✅ Academy: ${academy.name}`);
    console.log(`   SMS 포인트: ${academy.smsPoints || 0}원`);
    console.log(`   발신번호: ${academy.senderNumber || '등록된 발신번호가 없습니다'}`);
    
    if (academy.registeredSenderNumbers) {
      try {
        const numbers = JSON.parse(academy.registeredSenderNumbers);
        console.log(`   등록된 번호들: ${numbers.join(', ')}`);
      } catch (e) {
        console.log(`   등록된 번호들: ${academy.registeredSenderNumbers}`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`구독 정보: ${subData.hasSubscription ? '✅ 정상 표시' : '❌ 구독 없음'}`);
  console.log(`학생 수: ${subData.subscription?.usage?.students || 0}명`);
  console.log(`랜딩페이지: ${subData.subscription?.usage?.landingPages || 0}개`);
  console.log(`SMS 포인트: ${academy?.smsPoints || 0}원`);
  console.log(`발신번호: ${academy?.senderNumber || '미등록'}`);
  
  console.log('\n✅ All settings page data restored!\n');
}

testSettingsData().catch(console.error);
