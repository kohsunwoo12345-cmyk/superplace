async function testAdminReal() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  console.log('\n🔐 Testing Real Admin Login\n');
  
  try {
    // 1. Login
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@superplace.com',
        password: 'admin1234'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log('❌ Login failed:', error);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('User:', loginData.user.email);
    console.log('Role:', loginData.user.role);
    const token = loginData.token;
    
    // 2. Check AI Bots (with auth)
    console.log('\n📋 Checking AI Bots...');
    const botsResponse = await fetch(`${API_BASE}/api/admin/ai-bots`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (botsResponse.ok) {
      const botsData = await botsResponse.json();
      console.log(`✅ Found ${botsData.bots?.length || 0} bots`);
      
      if (botsData.bots && botsData.bots.length > 0) {
        console.log('\nBot List:');
        botsData.bots.forEach((bot, i) => {
          console.log(`${i+1}. ${bot.name}`);
          console.log(`   ID: ${bot.id}`);
          console.log(`   Active: ${bot.isActive ? 'Yes' : 'No'}`);
        });
      }
    }
    
    // 3. Check Academy Subscriptions (with auth)
    console.log('\n📋 Checking Academy Subscriptions...');
    const subsResponse = await fetch(`${API_BASE}/api/admin/academy-bot-subscriptions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Subscription API status:', subsResponse.status);
    
    if (subsResponse.ok) {
      const subsData = await subsResponse.json();
      console.log(`✅ Found ${subsData.subscriptions?.length || 0} subscriptions`);
      
      if (subsData.subscriptions && subsData.subscriptions.length > 0) {
        console.log('\nSubscription List:');
        subsData.subscriptions.forEach((sub, i) => {
          console.log(`\n${i+1}. Academy: ${sub.academyName || sub.academyId}`);
          console.log(`   Bot ID: ${sub.botId}`);
          console.log(`   Bot Name: ${sub.botName || 'N/A'}`);
          console.log(`   Product: ${sub.productName || 'N/A'}`);
          console.log(`   Slots: ${sub.remainingSlots}/${sub.totalSlots}`);
        });
      }
    } else {
      const error = await subsResponse.json();
      console.log('❌ Subscription error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminReal();
