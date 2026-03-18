const CLOUDFLARE_ACCOUNT_ID = "117379ce5c9d9af026b16c9cf21b10d5";
const DATABASE_ID = "8c106540-21b4-4fa9-8879-c4956e459ca1";
const API_TOKEN = "IMD0nKq28gqav_5BytcRDBhFNJDbvqVswrZVfKtp";

async function checkBotsKnowledge() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
  
  const sql = `
    SELECT 
      id,
      name,
      model,
      isActive,
      CASE 
        WHEN knowledgeBase IS NULL THEN 'NULL'
        WHEN knowledgeBase = '' THEN 'EMPTY'
        WHEN LENGTH(knowledgeBase) < 100 THEN 'SHORT'
        ELSE 'HAS_DATA'
      END as kb_status,
      LENGTH(knowledgeBase) as kb_length,
      SUBSTR(knowledgeBase, 1, 200) as kb_preview
    FROM ai_bots
    WHERE isActive = 1
    ORDER BY id DESC
    LIMIT 10
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql })
    });

    const data = await response.json();
    
    if (!data.success) {
      console.log("❌ Query failed:", JSON.stringify(data, null, 2));
      return;
    }

    const bots = data.result[0].results;
    
    console.log("\n=== 활성 봇 목록 (Knowledge Base 상태) ===\n");
    
    bots.forEach((bot, index) => {
      console.log(`${index + 1}. ${bot.name}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   Model: ${bot.model}`);
      console.log(`   Knowledge Base: ${bot.kb_status} (${bot.kb_length || 0} chars)`);
      
      if (bot.kb_preview && bot.kb_preview.trim()) {
        console.log(`   Preview: ${bot.kb_preview.substring(0, 100)}...`);
      }
      console.log();
    });
    
    // RAG 테스트할 봇 선택
    const botsWithKB = bots.filter(b => b.kb_status === 'HAS_DATA');
    
    if (botsWithKB.length > 0) {
      console.log(`\n✅ Knowledge Base가 있는 봇: ${botsWithKB.length}개`);
      console.log(`첫 번째 봇으로 RAG 테스트 진행: ${botsWithKB[0].id}`);
      return botsWithKB[0];
    } else {
      console.log("\n⚠️ Knowledge Base가 설정된 봇이 없습니다.");
      return null;
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
}

checkBotsKnowledge().then(bot => {
  if (bot) {
    console.log(`\n다음 명령으로 RAG 테스트 가능:`);
    console.log(`bash test-bot-rag.sh "${bot.id}"`);
  }
});
