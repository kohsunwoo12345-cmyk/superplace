async function testBotSubscriptionLink() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  console.log('\n🔍 Testing Bot and Subscription Linking\n');
  
  try {
    // 1. Get all AI bots
    console.log('1️⃣ Fetching AI bots from ai_bots table...');
    const botsResponse = await fetch(`${API_BASE}/api/admin/ai-bots`);
    const botsData = await botsResponse.json();
    
    console.log(`✅ Found ${botsData.bots?.length || 0} bots in ai_bots table`);
    if (botsData.bots && botsData.bots.length > 0) {
      console.log('\nSample bots:');
      botsData.bots.slice(0, 3).forEach(bot => {
        console.log(`  - ${bot.name} (ID: ${bot.id})`);
      });
    }
    
    // 2. Get store products
    console.log('\n2️⃣ Fetching store products...');
    const productsResponse = await fetch(`${API_BASE}/api/admin/store-products`);
    const productsData = await productsResponse.json();
    
    console.log(`✅ Found ${productsData.products?.length || 0} store products`);
    if (productsData.products && productsData.products.length > 0) {
      console.log('\nProducts with botId:');
      productsData.products.forEach(product => {
        if (product.botId) {
          console.log(`  - ${product.name} → botId: ${product.botId}`);
        }
      });
    }
    
    // 3. Get academy subscriptions
    console.log('\n3️⃣ Checking academy subscriptions...');
    const subsResponse = await fetch(`${API_BASE}/api/admin/academy-bot-subscriptions`);
    
    if (subsResponse.ok) {
      const subsData = await subsResponse.json();
      console.log(`✅ Found ${subsData.subscriptions?.length || 0} subscriptions`);
      
      if (subsData.subscriptions && subsData.subscriptions.length > 0) {
        console.log('\nSubscriptions:');
        subsData.subscriptions.forEach(sub => {
          console.log(`  - Academy: ${sub.academyName || sub.academyId}`);
          console.log(`    Bot ID: ${sub.botId}`);
          console.log(`    Product: ${sub.productName}`);
          console.log(`    Slots: ${sub.remainingStudentSlots}/${sub.totalStudentSlots}`);
          console.log('');
        });
      }
    } else {
      console.log('⚠️  Subscriptions API error:', subsResponse.status);
    }
    
    // 4. Analysis
    console.log('\n📊 Analysis:');
    const botIds = new Set((botsData.bots || []).map(b => b.id));
    const productBotIds = (productsData.products || [])
      .filter(p => p.botId)
      .map(p => p.botId);
    
    console.log(`\nAI Bots in database: ${botIds.size}`);
    console.log(`Products with botId: ${productBotIds.length}`);
    
    const missingBots = productBotIds.filter(id => !botIds.has(id));
    if (missingBots.length > 0) {
      console.log(`\n⚠️  Products referencing missing bots: ${missingBots.length}`);
      missingBots.forEach(id => console.log(`  - ${id}`));
    } else {
      console.log('\n✅ All product botIds reference existing bots');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBotSubscriptionLink();
