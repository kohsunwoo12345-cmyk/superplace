async function getBots() {
  try {
    console.log("Fetching bots from Pages API...\n");
    
    const response = await fetch("https://suplacestudy.com/api/admin/ai-bots");
    
    if (!response.ok) {
      console.log(`❌ API returned status ${response.status}`);
      const text = await response.text();
      console.log(text);
      return;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.bots) {
      console.log("❌ No bots data:", JSON.stringify(data, null, 2));
      return;
    }
    
    const bots = data.bots;
    
    console.log(`=== 총 ${bots.length}개의 봇 ===\n`);
    
    const activeBots = bots.filter(b => b.isActive);
    const botsWithKB = activeBots.filter(b => b.knowledgeBase && b.knowledgeBase.trim().length > 0);
    
    console.log(`활성 봇: ${activeBots.length}개`);
    console.log(`Knowledge Base 있음: ${botsWithKB.length}개\n`);
    
    console.log("=== Knowledge Base가 있는 활성 봇 ===\n");
    
    botsWithKB.forEach((bot, index) => {
      const kbLength = bot.knowledgeBase ? bot.knowledgeBase.length : 0;
      const kbPreview = bot.knowledgeBase ? bot.knowledgeBase.substring(0, 100) : "";
      
      console.log(`${index + 1}. ${bot.name}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   Model: ${bot.model || 'gemini-2.0-flash-exp'}`);
      console.log(`   KB Length: ${kbLength} chars`);
      
      // KB가 JSON 형태인지 텍스트인지 확인
      let kbType = "TEXT";
      try {
        const parsed = JSON.parse(bot.knowledgeBase);
        if (parsed.fileName || parsed.uploadedAt) {
          kbType = "JSON_METADATA";
        }
      } catch {
        kbType = "TEXT";
      }
      
      console.log(`   KB Type: ${kbType}`);
      
      if (kbPreview) {
        console.log(`   Preview: ${kbPreview}...`);
      }
      console.log();
    });
    
    if (botsWithKB.length > 0) {
      const testBot = botsWithKB[0];
      console.log(`\n✅ 테스트할 봇 선택:`);
      console.log(`   ID: ${testBot.id}`);
      console.log(`   Name: ${testBot.name}`);
      return testBot;
    } else {
      console.log("\n⚠️ Knowledge Base가 설정된 봇이 없습니다.");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

getBots();
