async function testAllFixes() {
  console.log('\n🔧 Testing All 4 Fixes\n');
  console.log('='.repeat(70));
  
  const ACADEMY_ID = 'academy-1771479246368-5viyubmqk';
  const USER_ID = 'user-1771479246368-du957iw33';
  
  // Login as admin
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
  
  // Test 1: Settings Page Data (구독 사용량)
  console.log('\n1️⃣ Settings Page - Subscription Usage Data');
  console.log('-'.repeat(70));
  
  const subRes = await fetch(`https://superplacestudy.pages.dev/api/subscription/check?userId=${USER_ID}&academyId=${ACADEMY_ID}`);
  const subData = await subRes.json();
  
  if (subData.hasSubscription && subData.subscription) {
    console.log(`✅ Subscription found: ${subData.subscription.planName}`);
    console.log(`   학생 수: ${subData.subscription.usage?.students || 0}`);
    console.log(`   랜딩페이지: ${subData.subscription.usage?.landingPages || 0}`);
    console.log(`   Usage object exists: ${!!subData.subscription.usage}`);
  } else {
    console.log(`❌ No subscription data`);
  }
  
  // Test 2: Points Consolidation
  console.log('\n2️⃣ Points System - Consolidated Structure');
  console.log('-'.repeat(70));
  
  const academyRes = await fetch('https://superplacestudy.pages.dev/api/admin/academies', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const academyData = await academyRes.json();
  const academy = academyData.academies.find(a => a.id === ACADEMY_ID);
  
  if (academy) {
    console.log(`✅ Academy Points Field: ${academy.smsPoints !== undefined ? 'EXISTS' : 'MISSING'}`);
    console.log(`   Current SMS Points: ${academy.smsPoints || 0}원`);
    console.log(`   Points are stored in: academy.smsPoints`);
  }
  
  // Test 3: AI Chat - Bot Visibility
  console.log('\n3️⃣ AI Chat Page - Bot Visibility');
  console.log('-'.repeat(70));
  
  const botsRes = await fetch(`https://superplacestudy.pages.dev/api/user/academy-bots?academyId=${ACADEMY_ID}`);
  const botsData = await botsRes.json();
  
  console.log(`✅ Bot API Response: ${botsRes.status}`);
  console.log(`   Success: ${botsData.success}`);
  console.log(`   Bots found: ${botsData.count || 0}`);
  
  if (botsData.bots && botsData.bots.length > 0) {
    console.log(`   Bot names:`);
    botsData.bots.forEach((bot, i) => {
      console.log(`     ${i+1}. ${bot.name} (${bot.id})`);
    });
  } else {
    console.log(`   ⚠️ No bots returned (check subscriptions)`);
  }
  
  // Test 4: User Detail 404 Fix
  console.log('\n4️⃣ User Detail API - 404 Fix');
  console.log('-'.repeat(70));
  
  const userDetailRes = await fetch(`https://superplacestudy.pages.dev/api/admin/users/${USER_ID}/detail`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  console.log(`✅ User Detail Response: ${userDetailRes.status}`);
  
  if (userDetailRes.ok) {
    const userData = await userDetailRes.json();
    console.log(`   Success: ${userData.success}`);
    console.log(`   User: ${userData.user?.name || 'Unknown'} (${userData.user?.email})`);
  } else {
    const errorData = await userDetailRes.json().catch(() => ({}));
    console.log(`   ❌ Error: ${errorData.error || userDetailRes.statusText}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`1. Settings UI (사용량 표시): ${subData.subscription?.usage ? '✅ 정상' : '❌ 문제 있음'}`);
  console.log(`2. Points System (통합): ${academy?.smsPoints !== undefined ? '✅ 정상' : '❌ 문제 있음'}`);
  console.log(`3. AI Chat Bots (표시): ${botsData.count > 0 ? '✅ 정상' : '⚠️ 구독 확인 필요'}`);
  console.log(`4. User Detail (404): ${userDetailRes.status === 200 ? '✅ 해결' : '❌ 문제 있음'}`);
  console.log('\n🎉 All tests completed!\n');
}

testAllFixes().catch(console.error);
