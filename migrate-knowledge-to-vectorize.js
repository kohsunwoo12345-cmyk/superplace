const WORKER_URL = "https://physonsuperplacestudy.kohsunwoo12345.workers.dev";
const API_KEY = "gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u";
const PAGES_API = "https://suplacestudy.com/api/admin/ai-bots";

async function migrateBot(botId, botName, knowledgeBase) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🤖 Processing: ${botName}`);
  console.log(`ID: ${botId}`);
  console.log(`KB Length: ${knowledgeBase.length} chars`);
  console.log("=".repeat(50));
  
  try {
    // Upload to Worker
    console.log("\n📤 Uploading to Worker Vectorize...");
    
    const response = await fetch(`${WORKER_URL}/bot/upload-knowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        botId: botId,
        fileName: `${botName}_knowledge.md`,
        fileContent: knowledgeBase
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Upload failed: ${response.status}`);
      console.log(errorText);
      return false;
    }
    
    const result = await response.json();
    
    console.log("\n✅ Upload successful!");
    console.log(`   Chunks: ${result.chunks || 0}`);
    console.log(`   Vectors: ${result.vectors || 0}`);
    console.log(`   Embedding Model: ${result.embedding || "N/A"}`);
    console.log(`   Vector Index: ${result.vectorIndex || "N/A"}`);
    
    // Wait for indexing
    console.log("\n⏳ Waiting 5 seconds for Vectorize indexing...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test RAG
    console.log("\n🔍 Testing RAG with sample query...");
    
    const testResponse = await fetch(`${WORKER_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        message: "첫 번째 단어를 알려주세요",
        botId: botId,
        userId: "migration-test",
        enableRAG: true,
        topK: 3,
        systemPrompt: "You are a helpful assistant.",
        conversationHistory: []
      })
    });
    
    const testResult = await testResponse.json();
    
    console.log("\n📊 RAG Test Result:");
    console.log(`   RAG Enabled: ${testResult.ragEnabled ? "✅" : "❌"}`);
    console.log(`   Context Count: ${testResult.ragContextCount || 0}`);
    
    if (testResult.ragContext && testResult.ragContext.length > 0) {
      console.log(`   Sample Context: ${testResult.ragContext[0].text.substring(0, 100)}...`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("========================================");
  console.log("Knowledge Base → Vectorize Migration");
  console.log("========================================");
  
  // Get bots from API
  console.log("\n📥 Fetching bots from database...");
  
  const response = await fetch(PAGES_API);
  const data = await response.json();
  
  if (!data.success || !data.bots) {
    console.log("❌ Failed to fetch bots");
    return;
  }
  
  const botsWithKB = data.bots.filter(b => 
    b.isActive && 
    b.knowledgeBase && 
    b.knowledgeBase.trim().length > 0 &&
    !b.knowledgeBase.includes('"fileName"') // Exclude already migrated
  );
  
  console.log(`\n✅ Found ${botsWithKB.length} bots with TEXT knowledgeBase`);
  
  let successCount = 0;
  
  for (const bot of botsWithKB) {
    const success = await migrateBot(bot.id, bot.name, bot.knowledgeBase);
    if (success) successCount++;
    
    // Wait between bots
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n========================================");
  console.log("Migration Complete");
  console.log("========================================");
  console.log(`✅ Successful: ${successCount}/${botsWithKB.length}`);
  console.log(`❌ Failed: ${botsWithKB.length - successCount}/${botsWithKB.length}`);
}

main();
