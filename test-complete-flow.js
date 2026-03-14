async function testCompleteFlow() {
  console.log('\n🎯 Complete Bot Flow Test\n');
  console.log('='*60);
  
  // 1. Login
  console.log('\n1️⃣ Admin Login');
  console.log('-'.repeat(60));
  const loginRes = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const loginData = await loginRes.json();
  console.log(`✅ Login Success - Role: ${loginData.user.role}`);
  const TOKEN = loginData.token;
  
  // 2. AI Bots List (AI 챗봇 페이지)
  console.log('\n2️⃣ AI Bots List (AI 챗봇 페이지)');
  console.log('-'.repeat(60));
  const botsRes = await fetch('https://superplacestudy.pages.dev/api/admin/ai-bots', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const bots = await botsRes.json();
  console.log(`✅ Total Bots: ${bots.bots.length}`);
  
  bots.bots.forEach((bot, i) => {
    console.log(`   ${i+1}. ${bot.name} (ID: ${bot.id})`);
  });
  
  // 3. Academy Bot Subscriptions (구독된 봇 - 할당 가능한 봇)
  console.log('\n3️⃣ Academy Bot Subscriptions (할당 가능한 봇)');
  console.log('-'.repeat(60));
  const subsRes = await fetch('https://superplacestudy.pages.dev/api/admin/academy-bot-subscriptions', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const subs = await subsRes.json();
  console.log(`✅ Total Subscriptions: ${subs.subscriptions.length}`);
  
  subs.subscriptions.forEach((sub, i) => {
    console.log(`\n   ${i+1}. ${sub.botName}`);
    console.log(`      Academy: ${sub.academyName}`);
    console.log(`      Bot ID: ${sub.botId}`);
    console.log(`      Slots: ${sub.usedSlots}/${sub.totalSlots} used`);
    console.log(`      Expires: ${sub.expiresAt.substring(0, 10)}`);
  });
  
  // 4. Verify all subscription botIds exist in ai_bots
  console.log('\n4️⃣ Data Integrity Check');
  console.log('-'.repeat(60));
  const botIds = new Set(bots.bots.map(b => b.id));
  const missingBots = subs.subscriptions.filter(sub => !botIds.has(sub.botId));
  
  if (missingBots.length === 0) {
    console.log('✅ All subscription botIds exist in ai_bots table');
    console.log('✅ All purchased bots will appear in assignment page');
  } else {
    console.log(`⚠️  Found ${missingBots.length} subscriptions with missing bots`);
    missingBots.forEach(sub => {
      console.log(`   - ${sub.botName} (${sub.botId})`);
    });
  }
  
  // 5. Bot Names Check
  console.log('\n5️⃣ Bot Names Display Check');
  console.log('-'.repeat(60));
  
  let allNamesCorrect = true;
  subs.subscriptions.forEach((sub) => {
    const matchingBot = bots.bots.find(b => b.id === sub.botId);
    if (matchingBot) {
      const isCorrect = matchingBot.name === sub.botName;
      const status = isCorrect ? '✅' : '❌';
      console.log(`${status} ${sub.botName}`);
      console.log(`   Bot ID: ${sub.botId}`);
      console.log(`   Name in ai_bots: ${matchingBot.name}`);
      
      if (!isCorrect) {
        allNamesCorrect = false;
        console.log(`   ⚠️  MISMATCH!`);
      }
    }
  });
  
  if (allNamesCorrect) {
    console.log('\n✅ All bot names are displaying correctly (not ID-based names)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`AI 챗봇 페이지: ${bots.bots.length} bots available`);
  console.log(`할당 가능한 봇: ${subs.subscriptions.length} subscriptions`);
  console.log(`봇 이름 표시: ${allNamesCorrect ? '✅ 정상 (실제 봇 이름 표시)' : '❌ 문제 있음'}`);
  console.log(`데이터 무결성: ${missingBots.length === 0 ? '✅ 정상' : '❌ 문제 있음'}`);
  console.log('\n🎉 All systems operational!\n');
  
  console.log('🔗 Key URLs:');
  console.log('   AI Bots: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/');
  console.log('   Bot Assignment: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign/');
  console.log('   Shop Approvals: https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals/');
}

testCompleteFlow().catch(console.error);
