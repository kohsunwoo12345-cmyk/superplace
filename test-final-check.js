async function finalCheck() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  console.log('\n🎯 Final System Check\n');
  console.log('='.repeat(60));
  
  try {
    // 1. AI Bots Check
    console.log('\n1️⃣ AI Bots List API');
    console.log('-'.repeat(60));
    const botsResponse = await fetch(`${API_BASE}/api/admin/ai-bots`);
    if (botsResponse.ok) {
      const botsData = await botsResponse.json();
      console.log(`✅ Status: ${botsResponse.status}`);
      console.log(`✅ Total bots: ${botsData.bots?.length || 0}`);
      console.log('\nTop 5 bots:');
      (botsData.bots || []).slice(0, 5).forEach((bot, i) => {
        console.log(`   ${i+1}. ${bot.name} (${bot.id})`);
      });
    } else {
      console.log(`❌ Status: ${botsResponse.status}`);
    }
    
    // 2. Store Products Check
    console.log('\n2️⃣ Store Products API');
    console.log('-'.repeat(60));
    const productsResponse = await fetch(`${API_BASE}/api/admin/store-products`);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log(`✅ Status: ${productsResponse.status}`);
      console.log(`✅ Total products: ${productsData.products?.length || 0}`);
      const productsWithBotId = (productsData.products || []).filter(p => p.botId);
      console.log(`✅ Products with botId: ${productsWithBotId.length}`);
    } else {
      console.log(`❌ Status: ${productsResponse.status}`);
    }
    
    // 3. Check Bot-Product Matching
    console.log('\n3️⃣ Bot-Product Matching');
    console.log('-'.repeat(60));
    const botsData = await fetch(`${API_BASE}/api/admin/ai-bots`).then(r => r.json());
    const productsData = await fetch(`${API_BASE}/api/admin/store-products`).then(r => r.json());
    
    const botIds = new Set((botsData.bots || []).map(b => b.id));
    const productBotIds = (productsData.products || [])
      .filter(p => p.botId)
      .map(p => p.botId);
    
    const missingBots = productBotIds.filter(id => !botIds.has(id));
    
    if (missingBots.length === 0) {
      console.log('✅ All product botIds reference existing bots');
    } else {
      console.log(`⚠️  ${missingBots.length} products reference missing bots:`);
      missingBots.forEach(id => console.log(`   - ${id}`));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📍 Key URLs:');
    console.log(`   - AI Bots: ${API_BASE}/dashboard/admin/ai-bots/`);
    console.log(`   - Bot Assignment: ${API_BASE}/dashboard/admin/ai-bots/assign/`);
    console.log(`   - Store: ${API_BASE}/store/`);
    console.log(`   - Purchase Approval: ${API_BASE}/dashboard/admin/bot-shop-approvals/`);
    
    console.log('\n✅ System check complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

finalCheck();
