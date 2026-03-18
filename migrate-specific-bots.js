const WORKER_URL = "https://physonsuperplacestudy.kohsunwoo12345.workers.dev";
const API_KEY = "gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u";

// First bot's knowledge base (백석중학교 3학년)
const BOT1_KB = `
## 📄 백석중학교  3학년 1과 단어 md.md

3학년 
1과 전체

**Spanish** *a.* 스페인의
**try** *v*. \*시도하다, \*먹어보다
(try – tried – tried)
**recipe** *n.* 요리법, 조리법
**another** *a.* 다른, 또 하나의
**sometime** *adv.* (미래∙과거의) 언젠가
**chance** *n.* 기회
**train** *v.* 훈련시키다
**achieve** *v.* 달성하다, 성취하다
**goal** *n.* \*목표, 골, 득점
`;

async function uploadKnowledge(botId, botName, content) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🤖 Uploading: ${botName}`);
  console.log(`ID: ${botId}`);
  console.log(`Content length: ${content.length} chars`);
  console.log("=".repeat(60));
  
  try {
    const response = await fetch(`${WORKER_URL}/bot/upload-knowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      body: JSON.stringify({
        botId: botId,
        fileName: `${botName.replace(/\s+/g, '_')}_knowledge.md`,
        fileContent: content
      })
    });
    
    const responseText = await response.text();
    console.log("\n📤 Upload Response:");
    console.log(`Status: ${response.status}`);
    
    try {
      const result = JSON.parse(responseText);
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log("\n✅ Upload successful!");
        console.log(`   Chunks: ${result.chunks || 0}`);
        console.log(`   Vectors: ${result.vectors || 0}`);
        
        // Wait for indexing
        console.log("\n⏳ Waiting 10 seconds for Vectorize indexing...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Test RAG
        console.log("\n🔍 Testing RAG...");
        const testResponse = await fetch(`${WORKER_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
          },
          body: JSON.stringify({
            message: "Spanish라는 단어의 뜻이 뭐야?",
            botId: botId,
            userId: "test-migration",
            enableRAG: true,
            topK: 3,
            systemPrompt: "당신은 영어 단어 선생님입니다.",
            conversationHistory: []
          })
        });
        
        const testResult = await testResponse.json();
        console.log("\n📊 RAG Test Result:");
        console.log(`   RAG Enabled: ${testResult.ragEnabled ? "✅ true" : "❌ false"}`);
        console.log(`   Context Count: ${testResult.ragContextCount || 0}`);
        
        if (testResult.ragContext && testResult.ragContext.length > 0) {
          console.log(`\n   Retrieved Contexts:`);
          testResult.ragContext.forEach((ctx, idx) => {
            console.log(`   ${idx + 1}. Similarity: ${ctx.similarity.toFixed(3)}`);
            console.log(`      Text: ${ctx.text.substring(0, 100)}...`);
          });
        }
        
        return true;
      } else {
        console.log("\n❌ Upload failed");
        return false;
      }
    } catch (parseError) {
      console.log("Response (raw):", responseText);
      return false;
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("========================================");
  console.log("Knowledge Base Migration Test");
  console.log("========================================");
  
  const bots = [
    {
      id: "bot-1773803533575-qrn2pluec",
      name: "백석중학교 3학년",
      kb: BOT1_KB
    }
  ];
  
  for (const bot of bots) {
    await uploadKnowledge(bot.id, bot.name, bot.kb);
    console.log("\n" + "=".repeat(60) + "\n");
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n✅ Migration test complete!");
}

main();
