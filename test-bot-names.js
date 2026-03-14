async function testBotNames() {
  console.log('\n🤖 Testing Bot Names\n');
  
  // Login first
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
  
  // Get AI Bots
  const botsRes = await fetch('https://superplacestudy.pages.dev/api/admin/ai-bots', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const bots = await botsRes.json();
  
  // Get Subscriptions
  const subsRes = await fetch('https://superplacestudy.pages.dev/api/admin/academy-bot-subscriptions', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const subs = await subsRes.json();
  
  console.log('📋 Bot Name Comparison:\n');
  
  subs.subscriptions.forEach((sub, i) => {
    const matchingBot = bots.bots.find(b => b.id === sub.botId);
    
    console.log(`${i+1}. Subscription:`);
    console.log(`   Product Name: ${sub.productName}`);
    console.log(`   Bot ID: ${sub.botId}`);
    console.log(`   Bot Name (from subscription API): ${sub.botName}`);
    
    if (matchingBot) {
      console.log(`   ✅ Bot Name (from ai_bots table): ${matchingBot.name}`);
      
      if (matchingBot.name !== sub.botName) {
        console.log(`   ⚠️  MISMATCH DETECTED!`);
      }
    } else {
      console.log(`   ❌ Bot not found in ai_bots table!`);
    }
    console.log('');
  });
}

testBotNames().catch(console.error);
