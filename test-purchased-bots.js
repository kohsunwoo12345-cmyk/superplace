const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5Ac3VwZXJwbGFjZS5jb20iLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJhY2FkZW15SWQiOiJhY2FkZW15LTE3NzE0NzkyNDYzNjgtNXZpeXVibXFrIn0.Y1234567890";

async function testPurchasedBots() {
  console.log('\n📦 Testing Purchased Bots Flow\n');
  
  // 1. Check bot purchase requests
  console.log('1️⃣ Checking Bot Purchase Requests:');
  const requestsRes = await fetch('https://superplacestudy.pages.dev/api/admin/bot-purchase-requests/list', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const requests = await requestsRes.json();
  console.log(`   Status: ${requestsRes.status}`);
  console.log(`   Total Requests: ${requests.requests?.length || 0}`);
  
  if (requests.requests && requests.requests.length > 0) {
    console.log('\n   Recent Purchases:');
    requests.requests.slice(0, 5).forEach((req, i) => {
      console.log(`   ${i+1}. ${req.productName} (${req.botId})`);
      console.log(`      Status: ${req.status}`);
      console.log(`      Academy: ${req.academyName}`);
    });
  }
  
  // 2. Check AI Bots table
  console.log('\n2️⃣ Checking AI Bots Table:');
  const botsRes = await fetch('https://superplacestudy.pages.dev/api/admin/ai-bots', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const bots = await botsRes.json();
  console.log(`   Status: ${botsRes.status}`);
  console.log(`   Total Bots: ${bots.bots?.length || 0}`);
  
  if (bots.bots) {
    console.log('\n   Bot Names:');
    bots.bots.forEach((bot, i) => {
      console.log(`   ${i+1}. ${bot.name} (${bot.id})`);
    });
  }
  
  // 3. Check Academy Bot Subscriptions
  console.log('\n3️⃣ Checking Academy Bot Subscriptions:');
  const subsRes = await fetch('https://superplacestudy.pages.dev/api/admin/academy-bot-subscriptions', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const subs = await subsRes.json();
  console.log(`   Status: ${subsRes.status}`);
  console.log(`   Total Subscriptions: ${subs.subscriptions?.length || 0}`);
  
  if (subs.subscriptions) {
    console.log('\n   Subscriptions:');
    subs.subscriptions.forEach((sub, i) => {
      console.log(`   ${i+1}. Academy: ${sub.academyName}`);
      console.log(`      Bot: ${sub.botName} (${sub.botId})`);
      console.log(`      Slots: ${sub.usedSlots}/${sub.totalSlots}`);
    });
  }
  
  // 4. Cross-check: Find subscriptions with missing bots
  console.log('\n4️⃣ Cross-Check: Subscriptions vs AI Bots:');
  if (subs.subscriptions && bots.bots) {
    const botIds = new Set(bots.bots.map(b => b.id));
    const missingBots = subs.subscriptions.filter(sub => !botIds.has(sub.botId));
    
    if (missingBots.length > 0) {
      console.log(`   ⚠️  Found ${missingBots.length} subscriptions with missing bots:`);
      missingBots.forEach((sub, i) => {
        console.log(`   ${i+1}. ${sub.botName} (${sub.botId}) - Academy: ${sub.academyName}`);
      });
    } else {
      console.log('   ✅ All subscription botIds exist in ai_bots table');
    }
  }
  
  console.log('\n✅ Test Complete\n');
}

testPurchasedBots().catch(console.error);
