async function testAIBotsPage() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  console.log('\n🤖 Testing AI Bots Page API\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/ai-bots`);
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ Found ${data.bots?.length || 0} bots\n`);
      
      if (data.bots) {
        console.log('Bot list:');
        data.bots.forEach((bot, i) => {
          console.log(`${i + 1}. ${bot.name}`);
          console.log(`   ID: ${bot.id}`);
          console.log(`   Active: ${bot.isActive}`);
          console.log('');
        });
      }
    } else {
      const error = await response.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAIBotsPage();
