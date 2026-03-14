async function testRealLoginFlow() {
  console.log('\n🔐 Testing Real Login Flow\n');
  
  // 1. Login
  console.log('1️⃣ Logging in as admin@superplace.com...');
  const loginRes = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const loginData = await loginRes.json();
  console.log(`   Status: ${loginRes.status}`);
  
  if (loginRes.status !== 200) {
    console.log(`   ❌ Login Failed: ${loginData.message || loginData.error}`);
    return;
  }
  
  console.log(`   ✅ Login Success`);
  console.log(`   Role: ${loginData.user.role}`);
  console.log(`   Academy: ${loginData.user.academyId}`);
  
  const TOKEN = loginData.token;
  
  // 2. Check AI Bots
  console.log('\n2️⃣ Fetching AI Bots:');
  const botsRes = await fetch('https://superplacestudy.pages.dev/api/admin/ai-bots', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const bots = await botsRes.json();
  console.log(`   Status: ${botsRes.status}`);
  console.log(`   Total Bots: ${bots.bots?.length || 0}`);
  
  // 3. Check Academy Bot Subscriptions
  console.log('\n3️⃣ Fetching Academy Bot Subscriptions:');
  const subsRes = await fetch('https://superplacestudy.pages.dev/api/admin/academy-bot-subscriptions', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const subsData = await subsRes.json();
  console.log(`   Status: ${subsRes.status}`);
  console.log(`   Response:`, subsData);
  
  if (subsData.subscriptions) {
    console.log(`   Total Subscriptions: ${subsData.subscriptions.length}`);
    subsData.subscriptions.forEach((sub, i) => {
      console.log(`\n   ${i+1}. ${sub.botName || sub.productName || 'Unknown'}`);
      console.log(`      Bot ID: ${sub.botId}`);
      console.log(`      Academy: ${sub.academyName}`);
      console.log(`      Slots: ${sub.usedSlots}/${sub.totalSlots}`);
    });
  }
  
  // 4. Check Bot Purchase Requests
  console.log('\n4️⃣ Fetching Bot Purchase Requests:');
  const reqRes = await fetch('https://superplacestudy.pages.dev/api/admin/bot-purchase-requests/list', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const reqData = await reqRes.json();
  console.log(`   Status: ${reqRes.status}`);
  
  if (reqData.requests && reqData.requests.length > 0) {
    console.log(`   Total Requests: ${reqData.requests.length}`);
    console.log('\n   Recent Purchases:');
    reqData.requests.slice(0, 5).forEach((req, i) => {
      console.log(`   ${i+1}. ${req.productName}`);
      console.log(`      Status: ${req.status}`);
      console.log(`      Bot ID: ${req.botId}`);
    });
  }
  
  console.log('\n✅ Test Complete\n');
}

testRealLoginFlow().catch(console.error);
